const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageComponentInteraction } = require('discord.js');
const { token, guildId, voiceChannelId, minimumMembers } = require(`./config.json`);
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

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

     // Check if the user is already in the asktojoin voice channel
    if (interaction.member.voice.channel.id === voiceChannelId) {
       return interaction.reply('You are already in the voice channel.');
    }

    const members = voiceChannel.members;

    if (members.size < minimumMembers) {
      await interaction.member.voice.setChannel(voiceChannel);
      return interaction.reply('You have been moved into the voice channel.');
    }

    const question = `Should ${interaction.user} be allowed to join the voice channel? Click on the buttons below to vote.`;

    let votes = {
      yes: 0,
      no: 0,
    };

    let voters = new Set();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('yes')
          .setLabel('Yes')
          .setStyle('1'),
        new ButtonBuilder()
          .setCustomId('no')
          .setLabel('No')
          .setStyle('1')
      );

    await interaction.reply({ content: `${members.map((member) => `<@${member.id}>`).join(', ')}, ${question}`, components: [row] });

    const filter = i => i.customId === 'yes' || i.customId === 'no';

    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async (i) => {
      if (!i.isButton()) return;
      if (voiceChannel.members.get(i.user.id)) {
        if (voters.has(i.user.id)) {
          // The user has already voted, ignore this vote
          return i.reply({ content: 'You have already voted!', ephemeral: true });
        }
    
        // Record the user's vote
        voters.add(i.user.id);

        if (i.customId === 'yes') {
          votes.yes++;
        } else {
          votes.no++;
        }
        await i.deferUpdate();
      }else {
        await i.deferUpdate();
        i.followUp({content: 'Leggo my eggo', ephemeral: true});
    }
    });

    collector.on('end', async () => {
      lastVoteEndTime = Date.now();
      //Reset the voters
      voters = new Set();
      if (votes.yes > votes.no) {
        try {
        await interaction.member.voice.setChannel(voiceChannel);
        interaction.channel.send(`${votes.yes} for, ${votes.no} against. ${interaction.user} has been allowed to join the voice channel.`);
        } catch (error) {
          console.error('Error moving member to voice channel:', error);
          interaction.channel.send('An error occurred while moving you to the voice channel.');
        }
      } else {
        interaction.channel.send(`${votes.yes} for, ${votes.no} against. ${interaction.user} has been denied access to the voice channel.`);
      }
    });
  }
});

client.login(token);
