import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

// Placeholder auth routes - implement based on your Google OAuth setup
router.post('/login', (req: Request, res: Response) => {
  // This will be integrated with your existing Google OAuth
  res.json({ message: 'Auth endpoint - integrate with frontend OAuth' });
});

router.post('/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', (req: Request, res: Response) => {
  // Return current user info
  res.json({ message: 'Get current user - implement JWT verification' });
});

// Get user role
router.get('/role', async (req: Request, res: Response) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }

    const result = await pool.query(
      'SELECT user_type FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      data: {
        role: result.rows[0].user_type || null,
      },
    });
  } catch (error) {
    console.error('Error fetching user role:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch user role' 
    });
  }
});

// Update user role
router.put('/role', async (req: Request, res: Response) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and role are required' 
      });
    }

    if (!['founder', 'vc'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid role. Must be "founder" or "vc"' 
      });
    }

    const result = await pool.query(
      'UPDATE users SET user_type = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2 RETURNING id, email, name, user_type',
      [role, email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      data: {
        user: result.rows[0],
      },
      message: `Role updated to ${role} successfully`,
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update user role' 
    });
  }
});

// Create or update user (called from frontend after Google OAuth)
router.post('/user', async (req: Request, res: Response) => {
  try {
    const { email, name, picture, googleId } = req.body;

    if (!email || !name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and name are required' 
      });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id, email, name, user_type, picture_url FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      // User exists, return their data
      return res.json({
        success: true,
        data: {
          user: existingUser.rows[0],
          isNewUser: false,
        },
      });
    }

    // Create new user (user_type will be NULL until they select a role)
    const newUser = await pool.query(
      `INSERT INTO users (email, name, picture_url, google_id, user_type)
       VALUES ($1, $2, $3, $4, NULL)
       RETURNING id, email, name, user_type, picture_url`,
      [email, name, picture || null, googleId || null]
    );

    res.json({
      success: true,
      data: {
        user: newUser.rows[0],
        isNewUser: true,
      },
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Error creating/fetching user:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create/fetch user' 
    });
  }
});

export default router;
