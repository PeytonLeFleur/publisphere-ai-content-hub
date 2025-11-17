# Publisphere Content Publisher WordPress Plugin

This plugin enables secure content publishing from the Publisphere platform to your WordPress site.

## Features

- ✅ Application Password support for secure authentication
- ✅ REST API status monitoring
- ✅ Yoast SEO integration
- ✅ Rank Math SEO integration
- ✅ Connection status dashboard
- ✅ Easy setup instructions

## Installation

### Method 1: Manual Upload

1. Download the `publisphere-publisher.php` file
2. Log into your WordPress admin dashboard
3. Go to **Plugins → Add New → Upload Plugin**
4. Click "Choose File" and select `publisphere-publisher.php`
5. Click "Install Now"
6. Activate the plugin

### Method 2: FTP Upload

1. Download the `publisphere-publisher.php` file
2. Connect to your WordPress site via FTP
3. Navigate to `/wp-content/plugins/`
4. Create a new folder called `publisphere-publisher`
5. Upload `publisphere-publisher.php` into this folder
6. Go to your WordPress admin dashboard
7. Navigate to **Plugins** and activate "Publisphere Content Publisher"

## Setup Instructions

After activating the plugin:

1. Go to **Publisphere** in your WordPress admin menu
2. Copy your **Site URL** (shown on the settings page)
3. Click on **Users → Your Profile** in WordPress
4. Scroll down to the "Application Passwords" section
5. Enter "Publisphere" as the application name
6. Click "Add New Application Password"
7. **Important:** Copy the generated password immediately (you'll only see it once)
8. Go to Publisphere platform and add your WordPress site with:
   - Site URL (from step 2)
   - Your WordPress username
   - The application password (from step 7)

## Requirements

- WordPress 5.6 or higher (for Application Password support)
- REST API must be enabled (enabled by default)
- User must have publishing capabilities

## SEO Plugin Support

The plugin automatically detects and supports:

- **Yoast SEO**: Syncs title, meta description, and focus keyword
- **Rank Math**: Syncs title, meta description, and focus keyword

These fields will be automatically populated when publishing from Publisphere.

## Troubleshooting

### "REST API not accessible" error

1. Check if REST API is enabled in WordPress
2. Verify your WordPress site doesn't have REST API disabled by a plugin
3. Check if your hosting provider blocks REST API requests

### "Authentication failed" error

1. Verify you copied the application password correctly (no spaces)
2. Check that your username is correct
3. Ensure the application password hasn't been revoked
4. Try generating a new application password

### "Permission denied" error

1. Ensure your WordPress user has publishing capabilities
2. Check if your user role allows post creation
3. Verify you're using an Editor or Administrator account

## Security

- Uses WordPress Application Passwords (not your main password)
- Credentials are encrypted in Publisphere database
- All API requests use HTTPS
- Compatible with standard WordPress security plugins

## Support

For issues or questions:
- Check the Publisphere documentation
- Contact Publisphere support
- Visit our community forum

## Version History

### 1.0.0
- Initial release
- Application Password support
- Yoast SEO integration
- Rank Math integration
- REST API monitoring
