# Glassmorphism MERN Trello (Task Management System)

A modern, visually stunning task management system inspired by Trello, featuring a beautiful glassmorphism aesthetic that combines functionality with elegant design. This full-stack application provides real-time collaboration and intuitive project management capabilities.

## Tech Stack

- **MongoDB** - Database for storing project data
- **Express.js** - Backend framework
- **React** - Frontend library for dynamic user interface
- **Node.js** - Runtime environment
- **Socket.io** - Real-time communication
- **Tailwind CSS** - Utility-first styling framework
- **Framer Motion** - Smooth animations and transitions

## Key Features

- 🔄 **Real-time Collaboration** - Team members can work together simultaneously with instant updates
- 🎯 **Drag & Drop** - Intuitive card movement between boards and lists
- 🔐 **Authentication** - Secure user registration and login system
- 📋 **Boards/Lists/Cards CRUD** - Full create, read, update, and delete operations
- 🏷️ **Priority Labels** - Visual indicators for task priorities
- 📅 **Due Dates** - Task deadline tracking and reminders
- 📊 **Dashboard Analytics** - Insights into project progress and productivity

## Installation Guide

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd trello-clone-mern
   ```

2. **Install Server Dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install Client Dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Set Up Environment Variables**

   Create a `.env` file in the server directory with the following variables:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   NODE_ENV=development
   ```

   Create a `.env` file in the client directory with the following variables:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```

5. **Run the Application**

   In the server directory:
   ```bash
   npm start
   ```

   In the client directory:
   ```bash
   npm start
   ```

## Screenshots

[Insert project screenshots here]

*Add your project images to showcase the glassmorphism design and functionality*

## Author

Mohammad Touqeer

---

Built with ❤️ using the MERN stack and modern UI design principles.
