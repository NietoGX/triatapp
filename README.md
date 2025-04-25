# Aplicación de Triaje de Equipos de Fútbol

Aplicación web desarrollada con Next.js, Tailwind CSS y Chakra UI para crear y gestionar dos equipos de fútbol: Team Borjas y Team Nietos.

## Características

- Sistema de drag and drop para asignar jugadores a equipos
- Posiciones específicas en cada equipo (Portero, Defensas, Delanteros, Suplentes)
- Diseño de tarjetas estilo FIFA Ultimate Team
- Interfaz responsive y moderna
- Gestión de alineaciones con límites de jugadores por posición

## Requisitos para avatar de jugadores

Debido a que la aplicación utiliza imágenes para los avatares de los jugadores, es necesario crear algunos avatares en la carpeta `/public/avatars/` con los nombres `player1.png`, `player2.png`, etc. o bien usar una imagen de avatar por defecto en `/public/default-avatar.png`.

## Cómo ejecutar

1. Instala las dependencias:

```bash
npm install
```

2. Ejecuta el servidor de desarrollo:

```bash
npm run dev
```

3. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Tecnologías utilizadas

- Next.js
- Tailwind CSS
- Chakra UI
- React DnD (Drag and Drop)
- TypeScript

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.
# triatapp
