<div align="center">
  <img width="350px" src="https://i.imgur.com/I7Nxp6B.png"/>
</div>

# Elytro

Elytro is a fun and robust Discord bot that brings a bunch of cool features to your server. Whether you’re running a busy community, hanging out with friends, or looking to add some friendly competition, Elytro has you covered with it's wide range of plugins.

## Plugins

### Economy
Elytro includes a comprehensive economy system, perfect for adding fun and competitiveness to your server. With this plugin, users can:
- Earn money through actions like **working**, **begging**, **digging**, and **gambling**.
- Spend money in the **shop** to buy items and enhance their status.
- Even **rob** or compete with friends to see who can build the most wealth!

### Moderation
Keep your server under control with Elytro's **Moderation** plugin. Manage members, channels, and messages effortlessly:
- **Warn, kick, or ban members** who break the rules.
- **Lock or unlock channels** to manage access during important events.
- **Purge messages** in bulk to keep chat clean.
- Use advanced tools to make server moderation easy and effective.

### Saluter
Welcome new members and bid farewell to those leaving with the **Saluter** plugin:
- Sends customizable **messages** when a user joins or leaves a server.
- Helps create a friendly, engaging environment for all members.

### Fun
Bring entertainment to your server with the **Fun** plugin:
- **Minigames** like trivia and other challenges.
- Practical tools like `/weather` for weather forecasts and `/dictionary` for quick definitions.
- Additional commands like `/wya` and `/joke`.

### Leveling
Boost engagement with the **Leveling** plugin:
- Track user activity and award XP for participation.
- Users can **level up** by being active in the server.
- Includes a **leaderboard** to encourage friendly competition.
- Generate personalized **level cards** for each user to showcase their progress.

## Installation

Run the following command to clone the repository.

```shell
git clone https://github.com/ElytroBot/Elytro
```

Then install the needed dependencies.

```shell
npm install
```
## Environment Variables

To use this bot you must first define some environment variables. First create a `.env` file and set the following environment variables.

|Variable| Description                                                     |
|:-------| :---------------------------------------------------------------|
|`token` | Your Discord bot's token.                                       |
|`db`    | The MongoDB connection string for your database.                |

## Run Locally

To run the bot locally use the following command.

```
npm run dev
```