const { Client, GatewayIntentBits } = require('discord.js');
const { token } = require(`./config.json`);
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages ] });

let lastVoteEndTime = 0;

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
    const currentTime = Date.now();

    if (currentTime - lastVoteEndTime < 60000) {
      return interaction.reply('Please wait for one minute between votes.');
    }

    const voiceChannel = interaction.guild.channels.cache.get('YOUR_VOICE_CHANNEL_ID');

    if (!interaction.member.voice.channel) {
      return interaction.reply('You must be in a voice channel to use this command.');
    }

    const members = voiceChannel.members;

    if (members.size < 3) {
      await interaction.member.voice.setChannel(voiceChannel);
      return interaction.reply('You have been moved into the voice channel.');
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

    const filter = (reaction, user) => {
      const member = voiceChannel.members.get(user.id);
      return ['✅', '❌'].includes(reaction.emoji.name) && !user.bot && member;
    };

    const collector = pollMessage.createReactionCollector(filter, { time: 60000 });

    collector.on('collect', (reaction, user) => {
      if (reaction.emoji.name === '✅') {
        votes.yes++;
      } else if (reaction.emoji.name === '❌') {
        votes.no++;
      }
    });

    collector.on('end', async () => {
      lastVoteEndTime = Date.now();

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
