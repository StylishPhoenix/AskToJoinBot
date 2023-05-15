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
    const collectorFilter = (reaction, user) => {
      return reaction.emoji.name === '👍' && user.id === message.author.id;
    };
    
    const collector = interaction.createReactionCollector({ filter: collectorFilter, time: 15000 });
    
    collector.on('collect', (reaction, user) => {
      console.log(`Collected ${reaction.emoji.name} from ${user.tag}`);
    });
    
    collector.on('end', collected => {
      console.log(`Collected ${collected.size} items`);
    });

/*    const currentTime = Date.now();

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

    await interaction.reply('Voting has started. Please wait for the result.');

    const pollMessage = await interaction.channel.send(
      `${members.map((member) => `<@${member.id}>`).join(', ')}, ${question}`
    );
    const yesReaction = '✅';
    const noReaction = '❌';
    
    await pollMessage.react(yesReaction);
    await pollMessage.react(noReaction);
    
const filter = (reaction, user) => {
  return ['✅', '❌'].includes(reaction.emoji.name);
};

    pollMessage.awaitReactions({ filter: filter, time: 30000 })
          .then(collected => {
         		const reaction = collected.first();
            console.log(`test`);
            if (reaction.emoji.name === '✅') {
              pollMessage.reply('You reacted with a thumbs up.');
            } else {
              pollMessage.reply('You reacted with a thumbs down.');
            }})
          .catch(collected => {
             pollMessage.reply('No one voted.');
    });
    lastVoteEndTime = Date.now();
    if (votes.yes > votes.no) {
      interaction.member.voice.setChannel(voiceChannel);
      interaction.channel.send(`${interaction.user} has been allowed to join the voice channel.`);
    } else {
      interaction.channel.send(`${interaction.user} has been denied access to the voice channel.`);
    }
  } */


});

client.login(token);
