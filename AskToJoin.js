const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.Guilds, Intents.FLAGS.GuildMessages, Intents.FLAGS.GuildVoiceStates] });
const token = 'YOUR_BOT_TOKEN';

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  const data = {
    name: 'asktojoin',
    description: 'Request to join a specific voice channel',
  };

  const commands = await client.guilds.cache.get('YOUR_GUILD_ID')?.commands.set([data]);
  console.log('Slash command registered:', commands);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'asktojoin') {
    const voiceChannel = interaction.guild.channels.cache.find(
      (channel) => channel.name === 'Voice Channel Name'
    );

    if (!interaction.member.voice.channel) {
      return interaction.reply('You must be in a voice channel to use this command.');
    }

    const members = voiceChannel.members;

    if (members.size === 0) {
      await interaction.member.voice.setChannel(voiceChannel);
      return interaction.reply('There are no users in the voice channel. You have been moved in.');
    }

    const question = `Should ${interaction.user} be allowed to join the voice channel? React with ✅ or ❌`;

    let votes = {
      yes: 0,
      no: 0,
    };

    const pollMessage = await interaction.channel.send(
      `${members.map((member) => `<@${member.id}>`).join(', ')}, ${question}`
    );

    await pollMessage.react('✅');
    await pollMessage.react('❌');

    const filter = (reaction, user) => ['✅', '❌'].includes(reaction.emoji.name) && !user.bot;
    const collector = pollMessage.createReactionCollector(filter, { time: 60000 });

    collector.on('collect', (reaction, user) => {
      if (reaction.emoji.name === '✅') {
        votes.yes++;
      } else if (reaction.emoji.name === '❌') {
        votes.no++;
      }
    });

    collector.on('end', async () => {
      if (votes.yes > votes.no) {
        await interaction.member.voice.setChannel(voiceChannel);
        interaction.channel.send(`${interaction.user} has been allowed to join the voice channel.`);
      } else {
        interaction.channel.send(`${interaction.user} has been denied access to the voice channel.`);
      }
    });

    await interaction.reply('Voting has started. Please wait for the result.');
  }
});

client.login(token);
