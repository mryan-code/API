/**
 * PM2 Ecosystem Configuration
 * 
 * This file defines PM2 processes for dev and master branches.
 * Each process loads its own environment variables from /etc/.
 * 
 * Environment variables are loaded via the startup script (start-pm2.sh) which:
 * 1. Loads variables from /etc/dev-crm-api.env (for dev branch)
 * 2. Loads variables from /etc/crm-api.env (for master/prod branch)
 * 
 * Usage:
 *   pm2 start ecosystem.config.js --only dev-crm-api
 *   pm2 start ecosystem.config.js --only crm-api
 *   pm2 start ecosystem.config.js  (starts both)
 * 
 * Note: The startup script handles environment variable loading.
 * Environment files in /etc/ are preserved during deployments.
 */

module.exports = {
	apps: [
		{
			name: "dev-crm-api",
			script: "dist/index.js",
			cwd: "/opt/dev-crm-api",
			instances: 1,
			exec_mode: "fork",
			// Environment variables are loaded by start-pm2.sh script
			// which sources /etc/dev-crm-api.env
			error_file: "/opt/dev-crm-api/logs/pm2-error.log",
			out_file: "/opt/dev-crm-api/logs/pm2-out.log",
			log_date_format: "YYYY-MM-DD HH:mm:ss Z",
			merge_logs: true,
			autorestart: true,
			max_memory_restart: "1G",
			node_args: "",
		},
		{
			name: "crm-api",
			script: "dist/index.js",
			cwd: "/opt/crm-api",
			instances: 1,
			exec_mode: "fork",
			// Environment variables are loaded by start-pm2.sh script
			// which sources /etc/crm-api.env
			error_file: "/opt/crm-api/logs/pm2-error.log",
			out_file: "/opt/crm-api/logs/pm2-out.log",
			log_date_format: "YYYY-MM-DD HH:mm:ss Z",
			merge_logs: true,
			autorestart: true,
			max_memory_restart: "1G",
			node_args: "",
		},
	],
};
