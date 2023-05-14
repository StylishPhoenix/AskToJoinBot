const { Client, GatewayIntentBits } = require('discord.js');
const { token, guildId, voiceChannelId, minimumMembers } = require(`./config.json`);
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent ] });

let lastVoteEndTime = 0;

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  const data = {
    name: 'asktojoin',
    description: 'Request to join a specific voice channel',
  };

  const commands = await client.guilds.cache.get(guildId)?.commands.set([data]);
  console.log('Slash command registered');
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'asktojoin') {
    const currentTime = Date.now();

    if (currentTime - lastVoteEndTime < 60000) {
      return interaction.reply('Please wait for one minute between votes.');
    }

    const voiceChannel = interaction.guild.channels.cache.get(voiceChannelId);

    if (!interaction.member.voice.channel) {
      return interaction.reply('You must be in a voice channel to use this command.');
    }

    const members = voiceChannel.members;

    if (members.size < minimumMembers) {
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
    const yesReaction = '✅';
    const noReaction = '❌';
    
    await pollMessage.react(yesReaction);
    await pollMessage.react(noReaction);
    
    pollMessage.reactions.cache.get(yesReaction).users.remove(client.user);
    pollMessage.reactions.cache.get(noReaction).users.remove(client.user);
    

    const filter = (reaction, user) => {
      const member = voiceChannel.members.get(user.id);
      return ['✅', '❌'].includes(reaction.emoji.name) && !user.bot && member;
    };

    const collector = pollMessage.createReactionCollector({filter: filter, time: 60000 });

    collector.on('collect', (reaction, user) => {
      console.log('test');
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
