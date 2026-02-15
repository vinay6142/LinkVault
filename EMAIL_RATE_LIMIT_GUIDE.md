# Email Rate Limit Guide - LinkVault

## What Is "Email Rate Limit Exceeded"?

This error comes from **Supabase Authentication** (your auth provider) when you try to sign up or log in too many times with the same email address in a short time period.

**It's a safety feature** to prevent:
- Brute force attacks (trying passwords repeatedly)
- Spam account creation
- Abuse of the authentication service

---

## When Do You Hit the Rate Limit?

### Signup Rate Limit
Triggered when you:
- Try to signup with the same email **5-10+ times** within 1 hour
- Each failed attempt counts

**Example:**
```
Time 14:00:00 → Signup with john@gmail.com ✓
Time 14:01:00 → Signup with john@gmail.com ✓
Time 14:02:00 → Signup with john@gmail.com ✓
Time 14:03:00 → Signup with john@gmail.com ✓
Time 14:04:00 → Signup with john@gmail.com ✓
Time 14:05:00 → Signup with john@gmail.com ❌ RATE LIMITED!
```

### Login Rate Limit
Triggered when you:
- Try to login **10-30+ times** within 1 hour
- Each wrong password attempt counts

---

## ✅ How To Fix It NOW

### **Solution 1: Wait (5-10 minutes)** ⏳ Easiest
1. Stop trying to signup/login
2. Wait 5-10 minutes
3. Try again with the same email
4. Should work ✓

**Why:** Supabase rate limits reset automatically after a cooldown period.

### **Solution 2: Use Different Email** 📧 Immediate
Use Gmail's **email alias** feature to create unlimited variations:

```
Main email:     john@gmail.com
Also works:     john+1@gmail.com
Also works:     john+test@gmail.com
Also works:     john+dev@gmail.com
Also works:     john.2@gmail.com
Also works:     john.test@gmail.com
```

**All go to the same inbox!** Supabase treats them as different emails.

**Steps:**
1. Signup with `john+1@gmail.com` (or any variation)
2. Works immediately ✓
3. All emails go to `john@gmail.com`
4. Login normally next time

### **Solution 3: Read Your Email** 📬
If you already signed up:
1. Check inbox for **verification email** from Supabase
2. Click the verification link
3. Email confirmed → Login works
4. Can prevent rate limit in future

---

## 🔧 Improved Error Messages (Just Added)

I've updated your app with **better error messages** so you know exactly what to do:

### Before:
```
"Error: Email rate limit exceeded"
```
❌ Not helpful - doesn't tell you how to fix it

### After:
```
"⏳ Too many signup attempts. Please wait 5-10 minutes and try again,
or use a different email (e.g., john+1@gmail.com)"
```
✅ Clear action items - user knows exactly what to do!

---

## 📝 Setup Instructions for Different Scenarios

### Scenario 1: First Time Signup
```
1. Go to signup page
2. Enter email (can use john+1@gmail.com)
3. Enter password (min 6 chars)
4. Enter display name
5. Click Sign Up
6. Wait for verification email
7. Click verification link
8. Done! Can now login
```

### Scenario 2: Hit Rate Limit
```
1. See error message: "Too many signup attempts..."
2. Wait 5-10 minutes (or use different email)
3. Try again
4. If still stuck, use: john+random@gmail.com
5. Sign up with new email
```

### Scenario 3: Can't Login
```
1. Did you verify email? Check "Email not confirmed" error
   → Look for email → Click verification link → Try login again
2. Wrong password? "Invalid email or password" error
   → Reset password or check spelling
3. Too many attempts? "Too many login attempts" error
   → Wait 5-10 minutes → Try again
```

---

## 🎯 Rate Limits Summary

| Scenario | Limit | Cooldown |
|----------|-------|----------|
| Signup attempts per email | 5-10 | 1 hour |
| Login attempts per email | 10-30 | 1 hour |
| Email verification resends | 3-5 | 24 hours |
| Password reset attempts | 3-5 | 1 hour |

---

## 🔐 Supabase Dashboard Setup (Optional)

If you want to change rate limits:

1. Go to **Supabase Dashboard**
2. Select your project
3. Go to **Authentication** → **Providers**
4. Click **Email**
5. Scroll to **Rate Limiting** section
6. Adjust limits as needed:
   - Increase if you want more attempts
   - Decrease if you want more security

**Default is usually good enough for development.**

---

## 💡 Pro Tips

### Tip 1: Use Gmail Plus Addressing
```
email: user@gmail.com
→ Can also use: user+1@gmail.com, user+2@gmail.com, etc.
All mail goes to user@gmail.com
Perfect for testing!
```

### Tip 2: Check Spam Folder
Sometimes verification emails go to spam:
1. Check spam/promotions folder
2. Mark as "Not Spam"
3. Click verification link

### Tip 3: Use Same Email in Future
Once you verify an email, you can login normally without hitting rate limits (unless you make 30+ login attempts in 1 hour).

### Tip 4: Development vs Production
- **Development:** Rate limits are lenient, don't worry
- **Production:** Rate limits protect your app from abuse

---

## 🆘 Still Having Issues?

### Error: "Email rate limit exceeded"
- Solution: Wait 5-10 minutes or use different email

### Error: "Invalid email or password"
- Solution: Check email/password spelling → Try again

### Error: "User not found"
- Solution: You haven't signed up yet → Go to signup page

### Error: "Email not confirmed"
- Solution: Check email → Click verification link → Try login again

### Error: Too many attempts from your IP
- Solution: Wait 15-30 minutes → Supabase lifts the block

---

## Files Modified

I've updated your app with better error handling:

✅ `frontend/src/pages/SignupPage.jsx`
- Better error messages for rate limits
- Suggests using `email+1@gmail.com`
- Tells user to wait or try different email

✅ `frontend/src/pages/LoginPage.jsx`
- Better error messages for login issues
- Explains if email not verified
- Clear guidance for rate limit

---

## Summary

| Issue | Solution |
|-------|----------|
| Hit rate limit on signup | Wait 5-10 min OR use john+1@gmail.com |
| Hit rate limit on login | Wait 5-10 min |
| Email not verified | Check inbox → Click link → Try again |
| Wrong password | Check spelling → Try again |
| Can't find verification email | Check spam folder |

**All issues are temporary and fixable!** 🚀

---

## Next Steps

1. **Wait 5-10 minutes** if just hit the limit
2. **Try again** with same or different email
3. **Check your email** (and spam) for verification link
4. **Click verification link** to confirm
5. **Login normally** going forward

**You're all set!** 💪
