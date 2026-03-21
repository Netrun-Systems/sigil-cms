# {{SITE_NAME}}

A [Sigil CMS](https://github.com/Netrun-Systems/netrun-cms) site.

## Setup

```bash
# Install dependencies
npm install

# Copy environment config and edit with your database credentials
cp .env.example .env

# Run database migrations
sigil migrate

# (Optional) Seed demo content
sigil seed

# Start development server
sigil dev
```

## Project Structure

```
{{PROJECT_NAME}}/
  content/       # Page and content JSON files
  public/        # Static assets
  src/           # Custom code and overrides
  sigil.config.ts  # Sigil configuration
```

## Commands

| Command         | Description                |
|-----------------|----------------------------|
| `sigil dev`     | Start development server   |
| `sigil build`   | Build for production       |
| `sigil start`   | Start production server    |
| `sigil migrate` | Run database migrations    |
| `sigil seed`    | Seed demo content          |
