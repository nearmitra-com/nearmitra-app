# Setting Up Custom SMTP for Supabase (Gmail)

This guide will help you set up Gmail SMTP to bypass Supabase's email rate limits and send professional confirmation emails.

---

## 📧 Step-by-Step Guide: Gmail SMTP Setup

### **Step 1: Create a Gmail App Password**

1. **Go to your Google Account**:
   - Visit: https://myaccount.google.com/

2. **Enable 2-Step Verification** (Required for App Passwords):
   - Click on **Security** in the left sidebar
   - Scroll to "How you sign in to Google"
   - Click **2-Step Verification**
   - Follow the setup process (you'll need your phone)

3. **Generate an App Password**:
   - After 2-Step Verification is enabled, go back to **Security**
   - Scroll to "How you sign in to Google"
   - Click **App passwords** (you might need to search for it)
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Enter name: ** NearMitra Supabase**
   - Click **Generate**
   - **COPY THE 16-CHARACTER PASSWORD** (you'll need this!)
   - Example: `abcd efgh ijkl mnop` (spaces don't matter)

---

### **Step 2: Configure Supabase SMTP Settings**

1. **Go to Supabase Auth Settings**:
   - Visit: https://supabase.com/dashboard/project/omgstprqqopwrchnxdvd/settings/auth

2. **Scroll down to "SMTP Settings"**

3. **Enable Custom SMTP**:
   - Toggle **"Enable Custom SMTP"** to ON

4. **Fill in the following details**:

   ```
   Sender email:        your-email@gmail.com
   Sender name:          NearMitra
   Host:                smtp.gmail.com
   Port number:         587
   Username:            your-email@gmail.com
   Password:            [paste the 16-character app password]
   ```

   **Important**: 
   - Use the **App Password** (16 characters), NOT your regular Gmail password
   - Port **587** is for TLS (recommended)
   - Alternative port: **465** for SSL

5. **Click "Save"**

---

### **Step 3: Test the Configuration**

1. **Send a test email**:
   - In the same SMTP Settings page, there should be a "Send test email" button
   - Click it and check your inbox

2. **Try signing up a new user**:
   - Go to your app's signup page
   - Create a new provider account with a real email
   - Check your inbox for the confirmation email

3. **Verify it works**:
   - You should receive the email within seconds
   - Click the confirmation link
   - Log in successfully

---

### **Step 4: Update Email Templates (Optional)**

1. **Go to Email Templates**:
   - Visit: https://supabase.com/dashboard/project/omgstprqqopwrchnxdvd/auth/templates

2. **Customize "Confirm signup" template**:
   - Add your branding
   - Customize the message
   - Example:
   ```html
   <h2>Welcome to  NearMitra!</h2>
   <p>Hi {{ .Email }},</p>
   <p>Thank you for signing up as a service provider.</p>
   <p>Please confirm your email address by clicking the link below:</p>
   <p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
   <p>Once confirmed, our admin team will review your application.</p>
   ```

3. **Save the template**

---

## 🎯 Alternative SMTP Providers

If you don't want to use Gmail, here are other options:

### **SendGrid** (Recommended for Production)
- **Free tier**: 100 emails/day
- **Setup**: https://sendgrid.com/
- **SMTP Settings**:
  ```
  Host: smtp.sendgrid.net
  Port: 587
  Username: apikey
  Password: [Your SendGrid API Key]
  ```

### **Mailgun**
- **Free tier**: 5,000 emails/month
- **Setup**: https://www.mailgun.com/
- **SMTP Settings**:
  ```
  Host: smtp.mailgun.org
  Port: 587
  Username: [Your Mailgun SMTP username]
  Password: [Your Mailgun SMTP password]
  ```

### **AWS SES** (Best for Scale)
- **Pricing**: $0.10 per 1,000 emails (very cheap)
- **Setup**: https://aws.amazon.com/ses/
- **SMTP Settings**: Varies by region

---

## ✅ Benefits of Custom SMTP

✅ **No rate limits** (or much higher limits)  
✅ **Professional sender email** (your domain)  
✅ **Better deliverability** (less likely to go to spam)  
✅ **Email analytics** (track opens, clicks)  
✅ **Customizable templates**  

---

## 🔧 Troubleshooting

### **"Authentication failed"**
- Make sure you're using the **App Password**, not your regular Gmail password
- Check that 2-Step Verification is enabled
- Verify the username is your full Gmail address

### **"Connection timeout"**
- Try port **465** instead of **587**
- Check if your firewall is blocking SMTP

### **Emails going to spam**
- Add an SPF record to your domain (advanced)
- Use a professional sender email (e.g., noreply@yourdomain.com)
- Warm up your email account (send gradually increasing volumes)

---

## 📝 Summary

1. ✅ Enable 2-Step Verification on Gmail
2. ✅ Generate App Password
3. ✅ Configure Supabase SMTP with Gmail settings
4. ✅ Test with a real signup
5. ✅ Customize email templates (optional)

**Result**: Unlimited email confirmations, no more rate limit errors! 🎉

---

## 🚀 Next Steps

After setting up SMTP, you should:

1. **Remove auto-confirmation** from the trigger (use production migration)
2. **Enable email confirmations** in Supabase Auth settings
3. **Test the full signup flow** with real emails
4. **Set up the provider approval workflow** we created earlier

Need help with any of these steps? Let me know!
