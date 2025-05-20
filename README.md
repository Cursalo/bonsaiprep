# bonsai2

# Bonsai Prep

## Environment Setup

1. Create a `.env.local` file in the root directory
2. Add the following environment variables:
```
GOOGLE_API_KEY=your_api_key_here
```
3. Never commit the `.env.local` file or expose API keys in the code

## Security Best Practices

- Always use environment variables for sensitive information
- Never commit API keys or secrets to the repository
- If a secret is exposed, rotate it immediately
- Use `.gitignore` to prevent committing sensitive files
