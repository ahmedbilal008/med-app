
# Welcome to your Lovable project

## Local Setup Guide

1. **Clone the repository**
   ```sh
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Add your Supabase credentials:**
   - Create a file named `.env.local` in the root of your project **(same folder as `package.json`)**.
   - Paste and fill in:
     ```
     VITE_SUPABASE_URL=your-supabase-url
     VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
     ```
   - You can find these credentials in your Supabase project settings.

4. **Run the development server**
   ```sh
   npm run dev
   ```
   - Then visit the displayed URL in your browser (usually http://localhost:8080 or similar).

## Other Notes

- **DO NOT** commit `.env.local` (it is ignored by default).
- If you experience "supabaseUrl is required" errors, ensure your `.env.local` file is present and correctly filled.
- If using Supabase features, make sure your database setup is up to date.
- Frontend env variables **must** start with `VITE_` for Vite to expose them.

## Example .env.local
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1Ni...
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a6e2c359-f79b-4615-a8f3-6725e6a21f70) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
