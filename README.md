# 🤖 BOTPRESS INBOX ✉️

This inbox dashboard can be used for managing conversations and users of your Botpress bot. It uses the official API (in Beta still) and Typescript client.

## ✳️ Features

-   List conversations
-   List messages of a conversation
-   List users of a conversation
-   Show details of conversation (tags and created/updated dates)
-   Send a new message to conversation
-   Delete conversation

## 💬 How to use

1. ⬇️ Download this project folder
2. 🚀 Start the project with `npm install && npm run start` and open it in the browser
3. 📝 You are going to see a screen asking for your token and for the bot URL
4. 🖥️ Go to Botpress Dashboard, click on your avatar, and go to Personal Access Tokens
5. 🗝️ Create a new token named 'inbox-dashboard' for example, and paste it in the app
6. 🔗 Still in the dashboard, open your bot and copy and paste the URL in the app
7. ✅ You're done!

## ✨ EXTRA

* 🤖 In order to send messages as the bot, you need to have a conversation where the bot has sent an automated message before (from Botpress Studio)
* 🌐 You can use this project on your localhost only (it works perfectly), or you could host it for free on a platform like Vercel/Netlify, in which case you would need to restrict access with native authentication from the platform (easier), or using JWT/Cookies.

## 👀 How it looks like
![image](https://github.com/devguilhermy/botpress-inbox/assets/55157846/7978adfe-ad28-41be-8573-3930023e9607)

## ✅ To do

-   [ ] Create conversation
-   [ ] Sort conversations by last message
-   [ ] Show user name in the conversation list
-   [ ] Delete user
-   [ ] Better styling
-   [ ] Responsive style for mobile
-   [ ] Authentication
-   [x] Load conversations and messages on scroll
-   [x] Get the bot id as user automatically
-	[x] Prompt the user for token and ids instead of using .env

## ⚙️ Libraries

This project makes use of the following libraries:

-   React.js v18.2 - app structure
-   Vite.js v3.1 - app build
-   Botpress Client v0.1.1 - requests to the botpress API
-   Date-fns v2.30 - date formatting
-   Typescript v4.8 - typings and interfaces
-   TailwindCSS v3.1 - styling
-   React Router Dom v6.11 - routing
-   CryptoJS - encrypting keys

## 👥 Contribution

We welcome contributions from the community, so feel free to create issues and open pull requests. As an open-source project, we value your help and feedback in making this project better.
Happy contributing and bot-building! ☺️

## 📃 License

This project is licensed under the MIT License. You are free to use, modify, and distribute it as per the terms of the license. You can also fork the project and customize it to suit your specific use case, whether you choose to keep it open source or not.

## ⚠️ Disclaimer

This project is an independent effort and is not affiliated with Botpress in any way. It utilizes the public API provided by the platform to list and manage conversations. Any misuse of this application is solely the responsibility of the user. The creators and contributors of this project disclaim any liability for any damages or issues arising from the use or misuse of this project.

