const emoji = require("node-emoji");
const apiai = require("apiai")(process.env.APIAI_TOKEN);
const Discord = require("discord.js");
const bot = new Discord.Client();

bot.on("ready", () => {
  bot.user.setPresence({
    status: "online",
    game: {
      type: "PLAYING",
      name: "my self-consciousness", // || an existential crisis
      url: "http://localhost:5000"
    },
    afk: false
  });

  bot.user.settings.convertEmoticons = true;
  bot.user.settings.detectPlatformAccounts = true;
  bot.user.settings.developerMode = true;
  bot.user.settings.enableTTSCommand = true;
  bot.user.settings.renderReactions = true;
  bot.user.settings.showCurrentGame = true;
  bot.user.settings.theme = "dark";

  console.log(`Logged in as ${bot.user.tag}!`);
});

let lastGuild, lastChannel, lastMessage, lastAttachment;
bot.on("message", async msg => {
  let { content } = msg;

  if (msg.author.id !== bot.user.id && content) {
    lastGuild = msg.guild || lastGuild;
    lastChannel = msg.channel || lastChannel;
    lastMessage = msg || lastMessage;
    lastAttachment = msg.attachments || lastAttachment;

    msg.channel.startTyping();

    if (
      content.match(
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
      )
    ) {
      // If user typed in a link.
      return;
    }

    content.match(/<@!\d+>/gm).forEach(async (match) => {
      let user = await bot.fetchUser(match.match(/\d+/)[0]);
      console.log(1, content);
      content = content.replace(`<@!${user.id}>`, user.username);
      console.log(2, content);
      // if (user.username !== bot.user.username);
    });

    console.log(3, content);

    // if (emoji.hasEmoji(content.charAt(0))) content = emoji.which(content);

    const req = apiai.textRequest(content, {
      sessionId: msg.author.id
    });
    req.on("response", res => {
      let text = res.result.fulfillment.speech;

      msg.channel.send(text, { tts: true });
      msg.channel.stopTyping();
    });

    req.on("error", async err => {
      const { status } = JSON.parse(err.responseBody);
      const me = await bot.fetchUser("265400036509220866");

      const embed = new Discord.RichEmbed()
        .setColor("#cc0000")
        .setTitle(err.name)
        .setAuthor(
          "Iridis",
          "https://cdn.discordapp.com/avatars/442838612665565201/03bd44635e08ce000ffbc3398e854e15.png"
        )
        .setDescription(err.message || "N/A")
        .addField("Code", status.code || "N/A", true)
        .addField("Type", status.errorType || "N/A", true)
        .addField("Details", status.errorDetails || "N/A", false)
        .addField("Last Guild", lastGuild || "N/A", true)
        .addField("Last Channel", lastChannel || "N/A", true)
        .addField("Last Message", lastMessage.content || "N/A", false)
        .setTimestamp()
        .setFooter("Error Report Log");

      if (lastAttachment)
        embed.attachFiles(
          lastAttachment.map((attachment, i) => attachment.url || "")
        );

      me.send(embed);

      bot.user.setPresence({
        status: "dnd",
        game: {
          type: "WATCHING",
          name: "him debug me",
          url: "http://localhost:5000/404"
        },
        afk: true
      });

      msg.channel.stopTyping();

      console.error(err);
      throw err;
    });

    req.end();
  }
});

bot.login(process.env.DISCORD_TOKEN);
