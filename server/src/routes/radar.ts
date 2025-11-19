import { Router, Request, Response } from 'express';
import { query } from '../db';
import { scrapeSourceWithAI, scrapeMultipleSources } from '../services/radarScraper';

const router = Router();

// GET /api/radar/sources - Get all radar sources
router.get('/sources', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT * FROM radar_sources 
      WHERE is_active = true 
      ORDER BY source_type DESC, created_at DESC
    `);

    res.json({ 
      sources: result.rows,
      total: result.rows.length 
    });
  } catch (error) {
    console.error('Error fetching radar sources:', error);
    res.status(500).json({ error: 'Failed to fetch radar sources' });
  }
});

// POST /api/radar/sources - Add a new custom source
router.post('/sources', async (req: Request, res: Response) => {
  try {
    const { name, url, addedBy } = req.body;

    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required' });
    }

    // Check if source already exists
    const existingSource = await query(
      'SELECT id FROM radar_sources WHERE url = $1',
      [url]
    );

    if (existingSource.rows.length > 0) {
      return res.status(400).json({ error: 'This source already exists' });
    }

    // Insert new source
    const result = await query(`
      INSERT INTO radar_sources (name, url, source_type, added_by, is_active)
      VALUES ($1, $2, 'custom', $3, true)
      RETURNING *
    `, [name, url, addedBy || null]);

    const newSource = result.rows[0];

    console.log(`✅ New source added: ${name}`);
    console.log('🤖 Starting immediate scrape for new source...');

    // Immediately scrape the new source
    try {
      const scrapeResult = await scrapeSourceWithAI(name, url);

      // Save scraped data to database
      for (const startup of scrapeResult.startups) {
        await query(`
          INSERT INTO radar_data 
          (source_id, company_name, headline, description, category, 
           funding_amount, funding_stage, investors, url, image_url, 
           published_date, scraped_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          newSource.id,
          startup.companyName,
          startup.headline,
          startup.description,
          startup.category,
          startup.fundingAmount,
          startup.fundingStage,
          startup.investors,
          startup.url,
          startup.imageUrl,
          startup.publishedDate,
          new Date()
        ]);
      }

      // Update last_scraped_at
      await query(
        'UPDATE radar_sources SET last_scraped_at = $1 WHERE id = $2',
        [new Date(), newSource.id]
      );

      console.log(`✅ Scraped ${scrapeResult.startups.length} items from new source`);

      res.json({ 
        source: newSource,
        scrapedCount: scrapeResult.startups.length,
        message: 'Source added and scraped successfully'
      });

    } catch (scrapeError) {
      console.error('Error scraping new source:', scrapeError);
      res.json({ 
        source: newSource,
        scrapedCount: 0,
        message: 'Source added but scraping failed. Use refresh to try again.'
      });
    }

  } catch (error) {
    console.error('Error adding radar source:', error);
    res.status(500).json({ error: 'Failed to add radar source' });
  }
});

// DELETE /api/radar/sources/:id - Delete a source
router.delete('/sources/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Allow deleting any source (including built-in)
    const result = await query(
      'DELETE FROM radar_sources WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Source not found' });
    }

    res.json({ message: 'Source deleted successfully' });
  } catch (error) {
    console.error('Error deleting radar source:', error);
    res.status(500).json({ error: 'Failed to delete radar source' });
  }
});

// POST /api/radar/refresh - Refresh all sources or specific source
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { sourceId } = req.body;

    let sources;
    
    if (sourceId) {
      // Refresh single source
      const result = await query(
        'SELECT * FROM radar_sources WHERE id = $1 AND is_active = true',
        [sourceId]
      );
      sources = result.rows;
    } else {
      // Refresh all active sources
      const result = await query(
        'SELECT * FROM radar_sources WHERE is_active = true ORDER BY created_at'
      );
      sources = result.rows;
    }

    if (sources.length === 0) {
      return res.status(404).json({ error: 'No sources found to refresh' });
    }

    console.log(`\n🔄 Refreshing ${sources.length} source(s)...`);

    // Scrape sources
    const scrapeResults = await scrapeMultipleSources(sources);

    let totalScraped = 0;

    // Save results to database
    for (const source of sources) {
      const scrapeResult = scrapeResults.get(source.id);
      if (!scrapeResult || scrapeResult.startups.length === 0) continue;

      // Delete old data for this source (keep last 30 days only)
      await query(`
        DELETE FROM radar_data 
        WHERE source_id = $1 
        AND scraped_at < NOW() - INTERVAL '30 days'
      `, [source.id]);

      // Insert new data
      for (const startup of scrapeResult.startups) {
        try {
          await query(`
            INSERT INTO radar_data 
            (source_id, company_name, headline, description, category, 
             funding_amount, funding_stage, investors, url, image_url, 
             published_date, scraped_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `, [
            source.id,
            startup.companyName,
            startup.headline,
            startup.description,
            startup.category,
            startup.fundingAmount,
            startup.fundingStage,
            startup.investors,
            startup.url,
            startup.imageUrl,
            startup.publishedDate,
            new Date()
          ]);
          totalScraped++;
        } catch (insertError) {
          console.error('Error inserting radar data:', insertError);
        }
      }

      // Update last_scraped_at
      await query(
        'UPDATE radar_sources SET last_scraped_at = $1 WHERE id = $2',
        [new Date(), source.id]
      );
    }

    console.log(`✅ Refresh complete: ${totalScraped} items scraped`);

    res.json({ 
      message: 'Sources refreshed successfully',
      sourcesRefreshed: sources.length,
      totalItemsScraped: totalScraped
    });

  } catch (error) {
    console.error('Error refreshing radar sources:', error);
    res.status(500).json({ error: 'Failed to refresh radar sources' });
  }
});

// GET /api/radar/data - Get radar data (with filters)
router.get('/data', async (req: Request, res: Response) => {
  try {
    const { category, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT 
        rd.*,
        rs.name as source_name,
        rs.url as source_url
      FROM radar_data rd
      JOIN radar_sources rs ON rd.source_id = rs.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (category && category !== 'all') {
      queryText += ` AND rd.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    queryText += ` ORDER BY rd.published_date DESC, rd.created_at DESC`;
    queryText += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await query(queryText, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM radar_data rd WHERE 1=1';
    const countParams: any[] = [];
    if (category && category !== 'all') {
      countQuery += ' AND rd.category = $1';
      countParams.push(category);
    }
    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({ 
      data: result.rows,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

  } catch (error) {
    console.error('Error fetching radar data:', error);
    res.status(500).json({ error: 'Failed to fetch radar data' });
  }
});

// GET /api/radar/categories - Get available categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT DISTINCT category, COUNT(*) as count
      FROM radar_data
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC, category ASC
    `);

    res.json({ 
      categories: result.rows
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// DELETE /api/radar/data/:id - Delete a radar data entry
router.delete('/data/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM radar_data WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Radar data entry not found' });
    }

    res.json({ 
      message: 'Radar data entry deleted successfully',
      deleted: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting radar data entry:', error);
    res.status(500).json({ error: 'Failed to delete radar data entry' });
  }
});

export default router;
