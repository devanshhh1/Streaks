# Deployment Guide - Linux/Production

## Prerequisites
- Node.js 16+ and npm
- MongoDB instance (local or cloud)
- Linux server (Ubuntu recommended)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo>
cd Streaks

# Backend setup
cd backend
npm install
npm run build

# Frontend setup
cd ../frontend
npm install
npm run build
```

### 2. Environment Configuration

#### Backend (.env)
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with production values:
MONGODB_URI=mongodb://mongo-host:27017/streaks
PORT=5030
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

#### Frontend (.env)
```bash
cp frontend/.env.example frontend/.env
# Edit frontend/.env with production values:
VITE_API_URL=https://api.yourdomain.com
```

### 3. Build Production Bundles

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### 4. Start Services

#### Backend
```bash
cd backend
npm start
```

#### Frontend (with Node server)
```bash
cd frontend
npm install -g serve
serve -s dist -l 3000
```

Or use Nginx/Apache to serve the static `dist` folder.

### 5. Database Setup

```bash
# Ensure MongoDB is running and accessible
# The app will auto-create collections on first run
```

## Docker Deployment (Optional)

### Backend Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/ .
RUN npm install && npm run build
ENV NODE_ENV=production
EXPOSE 5030
CMD ["npm", "start"]
```

### Frontend Dockerfile
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY frontend/ .
RUN npm install && npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Production Checklist

- [ ] MongoDB URI is set to production instance
- [ ] CORS_ORIGINS includes your domain
- [ ] NODE_ENV=production in backend
- [ ] API_BASE_URL points to production backend in frontend
- [ ] SSL certificates configured (use Nginx reverse proxy)
- [ ] Database backups enabled
- [ ] Logs configured
- [ ] Error tracking/monitoring enabled
- [ ] Rate limiting configured
- [ ] Environment variables not committed to git

## Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Frontend
    location / {
        root /var/www/streaks/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # API reverse proxy
    location /api/ {
        proxy_pass http://localhost:5030/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Troubleshooting

- **Port already in use**: Change PORT env var
- **MongoDB connection fails**: Check MONGODB_URI and network access
- **CORS errors**: Verify CORS_ORIGINS matches frontend domain
- **API calls failing**: Ensure VITE_API_URL is correct in frontend build

## Linux-Specific Notes

✅ All paths use forward slashes (/)
✅ All environment variables configured via .env files
✅ No Windows-specific commands used
✅ Compatible with common Linux distros (Ubuntu, CentOS, etc.)
