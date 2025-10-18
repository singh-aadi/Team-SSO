# Startup Scout MVP - Complete Setup Script
# Run this script to set up the entire backend

Write-Host "🚀 Starting Startup Scout Backend Setup..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
Write-Host "📦 Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if PostgreSQL is installed
Write-Host "🗄️  Checking PostgreSQL installation..." -ForegroundColor Yellow
try {
    $pgVersion = psql --version
    Write-Host "✅ PostgreSQL detected" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL not found. Please install PostgreSQL first." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host ""
Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
cd server
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green

# Create .env file if it doesn't exist
Write-Host ""
Write-Host "⚙️  Setting up environment..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env file created from .env.example" -ForegroundColor Green
    Write-Host "⚠️  Please edit .env and add your database credentials" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Ask user if they want to create the database
Write-Host ""
$createDb = Read-Host "Do you want to create the database 'startup_scout'? (y/n)"
if ($createDb -eq 'y') {
    Write-Host "🗄️  Creating database..." -ForegroundColor Yellow
    
    # Create database
    psql -U postgres -c "CREATE DATABASE startup_scout;"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database created successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Database might already exist or check PostgreSQL credentials" -ForegroundColor Yellow
    }
    
    # Run schema
    Write-Host "📊 Running database schema..." -ForegroundColor Yellow
    psql -U postgres -d startup_scout -f schema.sql
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database schema created successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create database schema" -ForegroundColor Red
        exit 1
    }
}

# Ask if user wants to seed database
Write-Host ""
$seedDb = Read-Host "Do you want to seed the database with sample data? (y/n)"
if ($seedDb -eq 'y') {
    Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
    npm run db:seed
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database seeded successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to seed database" -ForegroundColor Red
    }
}

# Create uploads directory
Write-Host ""
Write-Host "📁 Creating uploads directory..." -ForegroundColor Yellow
if (!(Test-Path "uploads")) {
    New-Item -ItemType Directory -Path "uploads"
    Write-Host "✅ Uploads directory created" -ForegroundColor Green
} else {
    Write-Host "✅ Uploads directory already exists" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Edit server/.env with your database credentials"
Write-Host "2. Run 'npm run dev' from the server directory"
Write-Host "3. API will be available at http://localhost:5001"
Write-Host "4. Test with: curl http://localhost:5001/health"
Write-Host ""
Write-Host "📚 Read server/README.md for API documentation"
Write-Host ""
Write-Host "🎉 Happy coding!" -ForegroundColor Green
