# Project Management Tool - Frontend

This is the frontend for the Project Management Tool (Trello Clone) built with React, Vite, and Tailwind CSS.

## Features

- **Glassmorphism Design**: Beautiful frosted glass effect UI using Tailwind CSS
- **Authentication**: Signup and Login functionality
- **Dashboard**: User dashboard with project statistics and activity
- **Routing**: React Router for navigation between pages

## Pages

- **Signup**: `/signup` - User registration page
- **Login**: `/login` - User authentication page
- **Dashboard**: `/dashboard` - Main application dashboard
- **Home**: `/` - Redirects to login if not authenticated, otherwise to dashboard

## Setup

1. Make sure you have Node.js installed
2. Navigate to the client directory: `cd client`
3. Install dependencies: `npm install`
4. Start the development server: `npm run dev`

## Dependencies

- React
- React Router DOM
- Tailwind CSS
- Axios

## API Integration

The frontend connects to the backend API. You can configure the API URL using the `VITE_API_URL` environment variable. If not set, it defaults to `http://localhost:5000/api`.
