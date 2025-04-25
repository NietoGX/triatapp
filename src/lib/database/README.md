# Supabase Database Integration for Futbol-Triaje

This directory contains the necessary files to integrate the application with a Supabase PostgreSQL database.

## Setup Instructions

1. Create a Supabase account and project at [supabase.com](https://supabase.com)

2. Create environment variables:
   - Copy `.env.local.example` to `.env.local` in the root directory
   - Update with your actual Supabase URL and anon key from your Supabase project settings

3. Set up the database schema:
   - In your Supabase project, navigate to the SQL Editor
   - Paste the contents of `schema.sql` and run the queries
   - This will create the players table and necessary indexes/triggers

4. Initialize the database (optional):
   - Make a POST request to `/api/players/initialize` to populate the database with sample players
   - You can do this using a tool like Postman or curl: `curl -X POST http://localhost:3000/api/players/initialize`

## Database Structure

The `players` table has the following fields:

| Field       | Type         | Description                       |
|-------------|--------------|-----------------------------------|
| id          | UUID         | Primary key, auto-generated       |
| name        | VARCHAR(255) | Player's full name                |
| nickname    | VARCHAR(255) | Player's nickname/alias           |
| position    | VARCHAR(50)  | Player's preferred position       |
| number      | INTEGER      | Jersey number                     |
| goals       | INTEGER      | Number of goals scored            |
| assists     | INTEGER      | Number of assists provided        |
| saves       | INTEGER      | Number of saves (for goalkeepers) |
| goals_saved | INTEGER      | Number of goals prevented         |
| rating      | INTEGER      | Player rating (1-5)               |
| created_at  | TIMESTAMP    | Creation timestamp                |
| updated_at  | TIMESTAMP    | Last update timestamp             |

## API Endpoints

The following API endpoints are available:

- `GET /api/players` - Get all players
- `POST /api/players` - Create a new player
- `GET /api/players/[id]` - Get a specific player
- `PUT /api/players/[id]` - Update a specific player
- `DELETE /api/players/[id]` - Delete a specific player
- `POST /api/players/initialize` - Initialize the database with sample players 