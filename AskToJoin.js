const { Client, GatewayIntentBits, MessageActionRow, MessageButton, MessageComponentInteraction } = require('discord.js');
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

    const yesButton = new MessageButton()
      .setCustomId('yes')
      .setLabel('Yes')
      .setStyle('SUCCESS');

    const noButton = new MessageButton()
      .setCustomId('no')
      .setLabel('No')
      .setStyle('DANGER');

    const row = new MessageActionRow()
      .addComponents(yesButton, noButton);

    await interaction.reply({ content: question, components: [row] });

    const filter = i => i.customId === 'yes' || i.customId === 'no';

    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async (i) => {
      if (!i.isButton()) return;
      if (voiceChannel.members.get(i.user.id)) {
        if (i.customId === 'yes') {
          votes.yes++;
        } else {
          votes.no++;
        }
        await i.deferUpdate();
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
  }
});

client.login(token);
