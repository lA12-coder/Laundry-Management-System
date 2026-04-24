# FuaLaundry Management System - Folder Structure

## Project Overview
This is a full-stack web application for managing laundry operations, built with React (Frontend), Django (Backend), and PostgreSQL (Database).

## Directory Structure

```
fua-laundry/
├── frontend/                          # React Frontend Application
│   ├── public/                        # Static assets
│   │   └── index.html                # HTML entry point
│   ├── src/
│   │   ├── components/               # Reusable React components
│   │   │   ├── layout/              # Layout components (Header, Sidebar, Footer)
│   │   │   ├── common/              # Shared components (Buttons, Modals, etc.)
│   │   │   ├── orders/              # Order-related components
│   │   │   ├── inventory/           # Inventory-related components
│   │   │   ├── customers/           # Customer-related components
│   │   │   └── staff/               # Staff-related components
│   │   ├── pages/                   # Page components (Dashboard, Orders, etc.)
│   │   ├── services/                # API services and utilities
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── context/                 # React Context for state management
│   │   ├── styles/                  # Global CSS files
│   │   ├── utils/                   # Helper functions
│   │   ├── App.js                   # Main app component
│   │   ├── App.css                  # App styles
│   │   ├── index.js                 # React DOM render
│   │   └── index.css                # Global styles
│   ├── package.json                 # Dependencies and scripts
│   ├── .env.example                 # Example environment variables
│   └── .gitignore                   # Git ignore rules
│
├── backend/                          # Django Backend Application
│   ├── config/                      # Project configuration
│   │   ├── settings.py              # Django settings
│   │   ├── urls.py                  # URL routing
│   │   ├── wsgi.py                  # WSGI configuration
│   │   └── __init__.py              # Package initializer
│   ├── apps/                        # Django applications
│   │   ├── users/                   # User management
│   │   │   ├── models.py            # User models
│   │   │   ├── views.py             # User views
│   │   │   ├── serializers.py       # DRF serializers
│   │   │   ├── urls.py              # User routes
│   │   │   └── __init__.py
│   │   ├── orders/                  # Order management
│   │   │   ├── models.py            # Order models
│   │   │   ├── views.py             # Order views
│   │   │   ├── serializers.py       # Order serializers
│   │   │   ├── urls.py              # Order routes
│   │   │   └── __init__.py
│   │   ├── inventory/               # Inventory management
│   │   │   ├── models.py            # Inventory models
│   │   │   ├── views.py             # Inventory views
│   │   │   ├── serializers.py       # Inventory serializers
│   │   │   ├── urls.py              # Inventory routes
│   │   │   └── __init__.py
│   │   ├── customers/               # Customer management
│   │   │   ├── models.py            # Customer models
│   │   │   ├── views.py             # Customer views
│   │   │   ├── serializers.py       # Customer serializers
│   │   │   ├── urls.py              # Customer routes
│   │   │   └── __init__.py
│   │   ├── staff/                   # Staff management
│   │   │   ├── models.py            # Staff models
│   │   │   ├── views.py             # Staff views
│   │   │   ├── serializers.py       # Staff serializers
│   │   │   ├── urls.py              # Staff routes
│   │   │   └── __init__.py
│   │   ├── payments/                # Payment processing
│   │   │   ├── models.py            # Payment models
│   │   │   ├── views.py             # Payment views
│   │   │   ├── serializers.py       # Payment serializers
│   │   │   ├── urls.py              # Payment routes
│   │   │   └── __init__.py
│   ├── middleware/                  # Custom middleware
│   ├── utils/                       # Utility functions
│   ├── tests/                       # Test files
│   ├── migrations/                  # Database migrations
│   ├── manage.py                    # Django management script
│   ├── requirements.txt             # Python dependencies
│   ├── .env.example                 # Example environment variables
│   └── .gitignore                   # Git ignore rules
│
├── database/                         # Database configuration
│   ├── init.sql                     # Initial SQL setup
│   ├── docker-compose.yml           # Docker compose for DB & Redis
│   └── migrations/                  # SQL migration scripts
│
├── docs/                            # Documentation
│   ├── API.md                       # API documentation
│   ├── DATABASE.md                  # Database schema
│   ├── SETUP.md                     # Setup instructions
│   └── DEPLOYMENT.md                # Deployment guide
│
├── .gitignore                       # Root gitignore
├── README.md                        # Project README
└── FOLDER_STRUCTURE.md              # This file
```

## Key Features by Module

### Users Module
- User registration and authentication
- User profile management
- Role-based access control

### Orders Module
- Order creation and management
- Order status tracking
- Order history

### Inventory Module
- Stock management
- Item tracking
- Low stock alerts

### Customers Module
- Customer database
- Customer information management
- Customer order history

### Staff Module
- Staff management
- Role assignment
- Performance tracking

### Payments Module
- Payment processing
- Transaction tracking
- Payment history

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL 13+
- Docker & Docker Compose (optional)

### Backend Setup
1. Navigate to the `backend` directory
2. Create virtual environment: `python -m venv venv`
3. Activate it: `source venv/bin/activate` (Linux/Mac) or `venv\Scripts\activate` (Windows)
4. Install dependencies: `pip install -r requirements.txt`
5. Copy `.env.example` to `.env` and configure
6. Run migrations: `python manage.py migrate`
7. Start server: `python manage.py runserver`

### Frontend Setup
1. Navigate to the `frontend` directory
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure
4. Start dev server: `npm start`

### Database Setup
1. Navigate to the `database` directory
2. Run Docker Compose: `docker-compose up -d`
3. This starts PostgreSQL and Redis services

## Technology Stack

### Frontend
- React 18
- React Router v6
- Axios for API calls
- CSS3 for styling

### Backend
- Django 4.2
- Django REST Framework
- PostgreSQL 15
- Redis for caching
- Celery for async tasks

### Database
- PostgreSQL 15
- PostGIS for geospatial features (optional)

## API Endpoints Structure
- `/api/accounts/` - User management
- `/api/orders/` - Order management
- `/api/inventory/` - Inventory management
- `/api/customers/` - Customer management
- `/api/staff/` - Staff management
- `/api/payments/` - Payment processing

## Notes
- All date/time operations use UTC
- API responses use standard HTTP status codes
- CORS is configured for cross-origin requests
- Environment variables must be set before running the application
