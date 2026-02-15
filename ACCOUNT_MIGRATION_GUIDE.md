# Account Migration Guide: 5983 → 6142

## Overview

**Good news:** No problems at all! ✅

Supabase account and GitHub account are completely independent. You can:
- Use main Gmail (6142) for Supabase
- Use different GitHub account if you want
- They don't interfere with each other

---

## Part 1: Supabase Account Switch (Email 5983 → 6142)

### Step 1: Create New Supabase Project with Main Gmail

1. Go to https://supabase.com
2. Log out from 5983 account (or sign out)
3. Sign up / Log in with your **main Gmail (6142)**
4. Click **Create new project**
5. Choose:
   - Organization: (create new if needed)
   - Project name: `linkvault` (or whatever)
   - Database password: (set a strong password)
   - Region: (same as before for latency)
6. Click **Create** and wait ~2 minutes

### Step 2: Get New Supabase Credentials

Once project is ready:

1. Go to **Settings → API**
2. Copy these values:
   - **Project URL** (SUPABASE_URL)
   - **anon public key** (SUPABASE_ANON_KEY)
   - **service_role key** (SUPABASE_SERVICE_KEY) ← Keep this secret!

### Step 3: Create Storage Bucket

1. Go to **Storage** section
2. Click **Create new bucket**
3. Name: `files` (IMPORTANT - must match!)
4. Set to **Public**
5. Click **Create**

### Step 4: Update Your `.env` File

Replace old Supabase credentials with new ones:

```env
# OLD (5983) - DELETE
SUPABASE_URL=https://old-5983-project.supabase.co
SUPABASE_ANON_KEY=old_key_from_5983
SUPABASE_SERVICE_KEY=old_service_key_from_5983

# NEW (6142) - REPLACE WITH:
SUPABASE_URL=https://new-6142-project.supabase.co
SUPABASE_ANON_KEY=new_key_from_6142
SUPABASE_SERVICE_KEY=new_service_key_from_6142
```

**Where to find `.env` file:**
- Location: `/home/vinay-reddy/Desktop/LinkVault/backend/.env`

### Step 5: Verify Changes

1. Restart backend server:
   ```bash
   npm stop        # (if running)
   npm start       # Start with new credentials
   ```

2. Check logs for:
   ```
   LinkVault backend running on port 5000
   [Cleanup Job] Scheduled cleanup job...
   ```

3. Test upload:
   - Upload a test file through the app
   - Check new Supabase dashboard → Storage → `files/` bucket
   - File should appear as: `files/{shareId}/{filename}`

---

## Part 2: GitHub Account Switch (VSCode Login 5983 → 6142)

### Step 1: Sign Out of GitHub from VSCode

1. Open VSCode
2. Click **your avatar** in bottom-left corner
3. Select **Sign out from GitHub**
   - Or: Cmd/Ctrl+Shift+P → "GitHub: Sign out"

### Step 2: Clear GitHub Token

Some systems cache the token. Optional but recommended:

**On Windows:**
```bash
# Delete cached credentials
rundll32.exe keymgr.dll,KRMainCRUI
# Find GitHub entries, delete them
```

**On Mac:**
```bash
# Delete from Keychain
security delete-internet-password -l "github.com"
```

**On Linux:**
```bash
# Clear git credentials
git config --global --unset credential.helper
rm ~/.git-credentials  # if exists
```

### Step 3: Sign In with Main Account (6142)

1. Click your avatar in VSCode bottom-left
2. Click **Sign in with GitHub**
3. Browser opens, log in with **6142 Gmail**
4. Grant permissions
5. Close browser, VSCode shows you're logged in ✅

### Step 4: Configure Git (Optional but Recommended)

Update Git config to use main account (6142):

```bash
# Set global user
git config --global user.email "your-6142-email@gmail.com"
git config --global user.name "Your Name"

# Or set per-repository (in LinkVault folder)
git config user.email "your-6142-email@gmail.com"
git config user.name "Your Name"
```

Verify:
```bash
git config --list
# Should show your 6142 email
```

---

## Part 3: Update GitHub Repository (If Needed)

If LinkVault repo is on GitHub account 5983:

### Option A: Transfer Repo to 6142 Account
1. Go to repo settings
2. Click **Danger Zone**
3. Click **Transfer** (in GitHub UI)
4. Enter new owner (your 6142 account)
5. Confirm

### Option B: Create New Repo Under 6142
1. Create new repo under 6142 account
2. Clone it locally
3. Add old code: `git remote add origin new-url`
4. Push all code
5. Delete old repo from 5983 (if desired)

### Option C: Keep Repo Under 5983 (Collaborator Access)
- You can push/pull using 6142 as a collaborator
- Just need permission on the 5983 repo

**Most common:** Option A (transfer repo)

---

## Checklist: Migration Steps

### Pre-Migration
- [ ] Note down all current Supabase credentials (just in case)
- [ ] Backup current `.env` file
- [ ] Check LinkVault repo location in GitHub

### Supabase Migration
- [ ] Login to Supabase with 6142 Gmail
- [ ] Create new project
- [ ] Get new credentials
- [ ] Create `files` bucket
- [ ] Update `.env` with new credentials
- [ ] Restart backend
- [ ] Test file upload

### GitHub Migration
- [ ] Sign out from VSCode GitHub (5983)
- [ ] Clear cached tokens
- [ ] Sign in with GitHub (6142)
- [ ] Update Git config with 6142 email
- [ ] Optionally transfer repo to 6142 account

### Final Verification
- [ ] Backend starts without errors
- [ ] Upload test file works
- [ ] File appears in new Supabase storage
- [ ] GitHub commits show 6142 author
- [ ] Git push works correctly

---

## Troubleshooting

### Issue: Upload fails after switching
**Solution:**
- Verify new bucket name is exactly: `files`
- Check SUPABASE_SERVICE_KEY is correct
- Restart backend
- Check Supabase dashboard → Settings → API (credentials)

### Issue: GitHub still shows 5983
**Solution:**
- Sign out completely: Settings → Accounts → GitHub
- Restart VSCode
- Sign in again
- Check Settings → Git → User Name & Email

### Issue: Old credentials still used somehow
**Solution:**
```bash
# Check which .env is being loaded
echo $SUPABASE_URL

# Restart completely
npm stop
npm start

# Or force kill Node
killall node
npm start
```

### Issue: Can't access old Supabase data
**Note:** New project is completely separate. Old data is in 5983 project.
- If needed: Create new storage with old files (manual migration)
- Or: Keep old 5983 project as backup, create new 6142 for new shares

---

## What Happens to Old Data?

**Current situation:**
- Old Supabase project (5983): Has any old file uploads
- New Supabase project (6142): Will have all future uploads

**Options:**
1. **Start fresh:** Only new uploads go to 6142 (Recommended)
2. **Migrate old data:** Copy old files from 5983 to 6142 bucket
3. **Keep both:** Use 6142 going forward, leave 5983 as backup

**Recommended:** Option 1 (start fresh) - Simplest and cleanest

---

## Environment Variable Reference

**File location:** `backend/.env`

**Old format:**
```env
SUPABASE_URL=https://xxxxx-5983-xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGc...
```

**New format (sample):**
```env
SUPABASE_URL=https://xxxxx-6142-xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGc...
```

**Note:** All three keys must be from NEW (6142) project!

---

## Git Commit After Migration

After switching, your future commits will show 6142:

```bash
# Verify config
git config user.email
git config user.name

# Make a commit (will use 6142 email)
git add .
git commit -m "Switch to Supabase account 6142"
git push
```

Old commits from 5983 will still show 5983 (history preserved).

---

## Timeline

| Step | Time | Notes |
|------|------|-------|
| Create Supabase project | 2-3 min | Wait for DB setup |
| Get credentials | 1 min | Copy from dashboard |
| Create storage bucket | 1 min | Quick |
| Update `.env` | 1 min | Edit file |
| Restart backend | 1 min | Test logs |
| Verify upload | 2 min | Test feature |
| Switch GitHub + git config | 5 min | Restart VSCode |
| **TOTAL** | **~15 min** | No downtime |

---

## Summary

✅ **Safe to switch** - No conflicts between accounts
✅ **Independent systems** - Supabase ≠ GitHub
✅ **Simple migration** - Just update `.env` and restart
✅ **Reversible** - Keep old credentials as backup
✅ **Clean start** - New project, new storage, fresh data

**Proceed with confidence!** 🚀

---

## Questions?

Still unsure? Common scenarios:

**Q: Will this break my app?**
A: No. Just update `.env` and restart. App works immediately with new credentials.

**Q: What about old file uploads?**
A: They stay in old Supabase (5983). New uploads go to new Supabase (6142).

**Q: Can I use both accounts?**
A: Yes, but not recommended. Cleaner to migrate fully.

**Q: Will my commits be weird?**
A: Old commits stay with 5983, new with 6142. Git history is fine.

**Q: Is it secure to share credentials?**
A: No! Keep `.env` private. Never commit it to GitHub.

---

Ready to proceed? Follow the checklist above! 🎯
