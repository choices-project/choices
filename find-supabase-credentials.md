# Finding Your Supabase Credentials - Step by Step Guide

## 🎯 Quick Navigation

1. **Go to [supabase.com](https://supabase.com)** and sign in
2. **Select your project** (or create a new one if needed)
3. **Follow the steps below** to find each credential

---

## 📍 Step 1: Find Your Project URL

### Where to Look:
1. In your Supabase dashboard, look at the **top-left corner**
2. You'll see your project name and a URL like: `https://your-project-ref.supabase.co`
3. **This is your Project URL** - copy it!

### Visual Guide:
```
┌─────────────────────────────────────────────────────────┐
│ Supabase Dashboard                                      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Your Project Name]                                 │ │
│ │ https://your-project-ref.supabase.co               │ │ ← Copy this URL
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 Step 2: Find Your API Keys

### Where to Look:
1. In the **left sidebar**, click **"Settings"** (gear icon)
2. Click **"API"** in the settings menu
3. You'll see a section called **"Project API keys"**

### What You'll Find:
```
Project API keys
├── Project URL: https://your-project-ref.supabase.co
├── anon public: [YOUR-ANON-KEY] ← Copy this
└── service_role secret: [YOUR-SERVICE-ROLE-KEY] ← Copy this
```

### Visual Guide:
```
┌─────────────────────────────────────────────────────────┐
│ Settings > API                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Project API keys                                    │ │
│ │                                                     │ │
│ │ Project URL                                         │ │
│ │ https://your-project-ref.supabase.co               │ │
│ │                                                     │ │
│ │ anon public                                         │ │
│ │ [YOUR-ANON-KEY]            │ │ ← Copy this
│ │                                                     │ │
│ │ service_role secret                                 │ │
│ │ [YOUR-SERVICE-ROLE-KEY]            │ │ ← Copy this
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Step 3: Find Your Database Password

### Where to Look:
1. In the **left sidebar**, click **"Settings"** (gear icon)
2. Click **"Database"** in the settings menu
3. Scroll down to **"Connection string"** section
4. Look for the password in the connection string

### What You'll Find:
```
Connection string
postgresql://postgres:[YOUR-PASSWORD]@db.your-project-ref.supabase.co:5432/postgres
                                 ↑
                         This is your password
```

### Visual Guide:
```
┌─────────────────────────────────────────────────────────┐
│ Settings > Database                                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Connection string                                   │ │
│ │                                                     │ │
│ │ postgresql://postgres:MySecretPassword123@db.      │ │
│ │ your-project-ref.supabase.co:5432/postgres         │ │
│ │                                                     │ │
│ │                                     ↑               │ │
│ │                              This is your password  │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Step 4: Collect All Credentials

Once you've found them all, you should have:

| Credential | Where Found | Example |
|------------|-------------|---------|
| **Project URL** | Dashboard top-left | `https://your-project-ref.supabase.co` |
| **Anon Key** | Settings > API > anon public | `[YOUR-ANON-KEY]` |
| **Service Role Key** | Settings > API > service_role secret | `[YOUR-SERVICE-ROLE-KEY]` |
| **Database Password** | Settings > Database > Connection string | `MySecretPassword123` |

---

## 🚀 Step 5: Use the Setup Script

Now that you have all your credentials:

```bash
./setup-supabase.sh
```

The script will ask for each credential one by one. Just paste them in when prompted!

---

## 🔍 Alternative: Quick Credential Check

If you want to quickly check what you have:

1. **Go to Settings > API**
2. **Copy the Project URL and anon key**
3. **Go to Settings > Database**
4. **Copy the password from the connection string**

That's it! You'll have everything you need.

---

## ❓ Still Can't Find Them?

### Common Issues:

**"I don't see my project"**
- Make sure you're signed in to the correct Supabase account
- Check if you have multiple projects

**"I can't see the API keys"**
- Make sure you're in Settings > API
- Look for the "Project API keys" section

**"The connection string is different"**
- That's okay! Just extract the password part
- It's the part between `postgres:` and `@db.`

**"I don't have a project"**
- Click "New Project" to create one
- Follow the setup wizard
- Then come back to this guide

---

## 🎉 You're Ready!

Once you have all 4 credentials, you can run the setup script and get your Choices voting system connected to Supabase!
