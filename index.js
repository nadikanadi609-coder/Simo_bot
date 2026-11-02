const TelegramBot = require('node-telegram-bot-api');
const { spawn } = require('child_process');
const TOKEN = '9232117401:AAFdlDLPXYtwGhJ4IfVmzeUdBxFc6c1C4N4';
const bot = new TelegramBot(TOKEN, {polling: true});
console.log('BOT 10 LIVES KHEDDAM!');

let streams = {}; // id -> {proc, name, key}
let nextId = 1;
let waiting = {};
let tempData = {};

let channels = [
  { name: '📺 قناة 1', url: 'HNA_HOT_M3U8_1' },
  { name: '📺 قناة 2', url: 'HNA_HOT_M3U8_2' },
  { name: '📺 قناة 3', url: 'HNA_HOT_M3U8_3' },
];

function showMenu(chatId){
  let count = Object.keys(streams).length;
  bot.sendMessage(chatId, `📡 *Simo Stream Bot - 10 Lives*\n🟢 خدامين دابا: ${count}/10`, { parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: [
      [{text: '📡 بدا ستريم جديد +', callback_data: 'start_stream'}],
      [{text: '📺 القنوات', callback_data: 'channels'}],
      [{text: '📊 شوف اللايفات الخدامين', callback_data: 'status'}],
      [{text: '⏹ حبس الكل', callback_data: 'stop_all'}]
    ]}
  });
}

function startStream(chatId, m3u8, streamKey, name){
  if(Object.keys(streams).length >= 10){ bot.sendMessage(chatId, '⚠️ وصلتي لـ 10 لايفات! حبس شي واحد عاد زيد'); return; }
  let id = nextId++;
  let rtmp = `rtmp://live-api-s.facebook.com:80/rtmp/${streamKey}`;
  bot.sendMessage(chatId, `🚀 لايف #${id} طالع...\n📺 ${name}\nاستنى 10 ثواني و شوف فيسبوك`);
  let proc = spawn('ffmpeg', ['-re','-i', m3u8, '-c:v','copy','-c:a','aac','-f','flv', rtmp]);
  streams[id] = {proc, name};
  proc.on('close', () => { delete streams[id]; });
}

function stopOne(chatId, id){
  if(streams[id]){ streams[id].proc.kill('SIGINT'); delete streams[id]; bot.sendMessage(chatId, `⏹ تحبس لايف #${id} ✅`); showMenu(chatId); }
}

bot.onText(/\/start/, (msg)=> showMenu(msg.chat.id));
bot.on('callback_query', (q)=>{
  const chatId = q.message.chat.id; const userId = q.from.id; const data = q.data;
  bot.answerCallbackQuery(q.id);
  if(data==='start_stream'){ waiting[userId]='m3u8'; bot.sendMessage(chatId,'📡 صيفط ليا رابط m3u8:'); }
  if(data==='channels'){
    let kb = channels.map((c,i)=> [{text: c.name, callback_data: 'play_'+i}]);
    kb.push([{text: '🔙 رجوع', callback_data: 'back'}]);
    bot.sendMessage(chatId,'📺 اختار قناة:', {reply_markup:{inline_keyboard: kb}});
  }
  if(data==='back'){ showMenu(chatId); }
  if(data==='stop_all'){
    for(let id in streams){ streams[id].proc.kill('SIGINT'); }
    streams = {}; bot.sendMessage(chatId,'⏹ تحبسو كاملين ✅');
  }
  if(data==='status'){
    let ids = Object.keys(streams);
    if(ids.length===0){ bot.sendMessage(chatId,'🔴 حتى واحد ما خدام'); return; }
    let txt = `🟢 خدامين ${ids.length}/10:\n\n`;
    ids.forEach(id=> txt += `#${id} - ${streams[id].name}\n`);
    let kb = ids.map(id=> [{text: `⏹ حبس #${id} ${streams[id].name}`, callback_data: 'stop_'+id}]);
    kb.push([{text: '🔙 رجوع', callback_data: 'back'}]);
    bot.sendMessage(chatId, txt, {reply_markup:{inline_keyboard: kb}});
  }
  if(data.startsWith('stop_')){
    let id = data.split('_')[1]; stopOne(chatId, id);
  }
  if(data.startsWith('play_')){
    let idx = parseInt(data.split('_')[1]);
    let ch = channels[idx];
    waiting[userId]='key_for_channel';
    tempData[userId]={m3u8: ch.url, name: ch.name};
    bot.sendMessage(chatId,`اخترتي ${ch.name}\nدابا صيفط Stream Key ديال فيسبوك (واحد):`);
  }
});

bot.on('message', (msg)=>{
  const userId = msg.from.id; const chatId = msg.chat.id; const text = msg.text;
  if(!text || text.startsWith('/')) return;
  if(waiting[userId]==='m3u8'){
    tempData[userId]={m3u8: text, name: 'رابط يدوي'};
    waiting[userId]='key';
    bot.sendMessage(chatId,'مزيان ✅\nدابا صيفط Stream Key ديال فيسبوك:');
  }
  else if(waiting[userId]==='key'){
    let d = tempData[userId]; waiting[userId]=null;
    startStream(chatId, d.m3u8, text, d.name);
    setTimeout(()=> showMenu(chatId), 1000);
  }
  else if(waiting[userId]==='key_for_channel'){
    let d = tempData[userId]; waiting[userId]=null;
    startStream(chatId, d.m3u8, text, d.name);
    setTimeout(()=> showMenu(chatId), 1000);
  }
});







