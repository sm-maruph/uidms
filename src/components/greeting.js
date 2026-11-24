const dhakaHour=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dhaka',hour:'2-digit',hourCycle:'h23'});
export function timeGreeting(date=new Date()){
 const hour=Number(dhakaHour.format(date));
 return hour>=5&&hour<12?'Good morning':hour<17&&hour>=12?'Good afternoon':hour>=17&&hour<21?'Good evening':'Good night';
}
