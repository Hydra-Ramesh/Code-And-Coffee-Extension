# 📦 Publishing Guide — Code & Coffee Theme

Step-by-step instructions for publishing the Code & Coffee Theme to the VS Code Marketplace via Azure DevOps.

---

## Prerequisites

- **Node.js** v18+ installed
- **npm** v9+ installed
- A **Microsoft account** (free)

---

## Step 1: Create an Azure DevOps Organization

1. Go to [https://dev.azure.com](https://dev.azure.com)
2. Sign in with your **Microsoft account**
3. Click **"New organization"** and follow the prompts
4. Give your organization a name (e.g., `code-and-coffee`)
5. Create a project (any name — this is just for the PAT)

---

## Step 2: Generate a Personal Access Token (PAT)

1. In Azure DevOps, click your **profile icon** → **Personal Access Tokens**
2. Click **"+ New Token"**
3. Configure:
   - **Name**: `vsce-publish`
   - **Organization**: `All accessible organizations`
   - **Expiration**: Choose your preferred duration (max 1 year)
   - **Scopes**: Click **"Show all scopes"**, then check:
     - ✅ **Marketplace** → **Manage**
4. Click **Create**
5. **⚠️ COPY THE TOKEN NOW** — you won't be able to see it again!

---

## Step 3: Create a Publisher Account

1. Go to the [VS Code Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
2. Sign in with the same Microsoft account
3. Click **"Create publisher"**
4. Fill in:
   - **Name**: `Code & Coffee` (display name)
   - **ID**: `code-and-coffee` (must match `publisher` in `package.json`)
5. Click **Create**

---

## Step 4: Install vsce CLI

```bash
npm install -g @vscode/vsce
```

Verify installation:
```bash
vsce --version
```

---

## Step 5: Login with Your Publisher

```bash
vsce login code-and-coffee
```

When prompted, paste your **Personal Access Token** from Step 2.

---

## Step 6: Test Locally Before Publishing

### Build the extension
```bash
npm install
npm run compile
```

### Package as VSIX
```bash
vsce package
```

This creates a `.vsix` file (e.g., `code-and-coffee-theme-1.0.0.vsix`).

### Install locally for testing
```bash
code --install-extension code-and-coffee-theme-1.0.0.vsix
```

### Test checklist
- [ ] All three themes appear in theme picker
- [ ] Syntax highlighting looks correct
- [ ] All three commands work from Command Palette
- [ ] Focus Mode toggles properly
- [ ] Deep Work Session timer works
- [ ] Coffee Break Reminder activates/deactivates
- [ ] No errors in Developer Tools console (`Help → Toggle Developer Tools`)

---

## Step 7: Publish to Marketplace

Once testing is complete:

```bash
vsce publish
```

Your extension will be available on the Marketplace within a few minutes!

Verify at: `https://marketplace.visualstudio.com/items?itemName=code-and-coffee.code-and-coffee-theme`

---

## Step 8: Updating Versions

### Patch update (1.0.0 → 1.0.1)
```bash
vsce publish patch
```

### Minor update (1.0.0 → 1.1.0)
```bash
vsce publish minor
```

### Major update (1.0.0 → 2.0.0)
```bash
vsce publish major
```

### Specific version
```bash
vsce publish 1.2.3
```

**Remember to update `CHANGELOG.md` before each release!**

---

## Step 9: Unpublishing (if needed)

```bash
vsce unpublish code-and-coffee.code-and-coffee-theme
```

⚠️ This removes the extension from the Marketplace entirely. Use with caution.

---

## Automated Publishing with GitHub Actions

The included `.github/workflows/ci.yml` automatically publishes new versions when you push a git tag:

```bash
# After updating version in package.json and CHANGELOG.md:
git add .
git commit -m "Release v1.1.0"
git tag v1.1.0
git push origin main --tags
```

### Required GitHub Secret
Add your Azure DevOps PAT as a repository secret:
1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Name: `VSCE_PAT`
4. Value: Your Personal Access Token from Step 2

---

## Troubleshooting

### "ERROR: Missing publisher name"
Make sure the `publisher` field in `package.json` matches your publisher ID exactly.

### "ERROR: Unauthorized (401)"
Your PAT may have expired. Generate a new one in Azure DevOps and run `vsce login` again.

### "ERROR: The 'icon' specified in package.json is not a PNG"
The marketplace requires a PNG icon. Convert your SVG to PNG (128x128 minimum):
```bash
# Using ImageMagick or any image converter
convert images/logo.svg -resize 128x128 images/logo.png
```

### Extension not appearing in search
- Ensure you have good **keywords** in `package.json`
- The **description** field is searchable — make it descriptive
- It may take up to 10 minutes for the extension to be indexed

---

<p align="center">
  <strong>Happy publishing! ☕</strong>
</p>
