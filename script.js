
// Simple site script: manages services, barbers, booking, and admin password protection
(function(){
  const SERVICES = [
    {id:'corte', name:'Corte', price:25},
    {id:'barba', name:'Barba', price:20},
    {id:'sobrancelha', name:'Sobrancelha', price:10},
    {id:'pe', name:'Pezinho', price:10},
    {id:'bigode', name:'Bigode', price:5},
    {id:'cavanhaque', name:'Cavanhaque', price:15},
    {id:'freestyle', name:'Freestyle', price:10},
    {id:'nevou', name:'Nevou', price:80},
    {id:'luzes', name:'Luzes', price:65},
    {id:'reflexo', name:'Reflexo', price:80},
    {id:'tintura', name:'Tintura', price:25},
    {id:'colorido', name:'Colorido', price:70},
    {id:'pigmentacao', name:'Pigmentação', price:10},
  ];

  // default working hours Mon-Sat 08:00-20:00
  const WORKING = {start:8, end:20, days:[1,2,3,4,5,6]}; // 0=Sun
  const ADMIN_PW = 'admin2025';

  // DOM refs
  const serviceSelect = document.getElementById('service-select');
  const barberSelect = document.getElementById('barber-select');
  const dateInput = document.getElementById('date-select');
  const timeSelect = document.getElementById('time-select');
  const confirmBtn = document.getElementById('confirm-book');
  const bookingMsg = document.getElementById('booking-msg');
  const barbersListEl = document.getElementById('barbers-list');
  const servicesPanel = document.getElementById('services');

  // populate services
  SERVICES.forEach(s=>{
    const opt = document.createElement('option');
    opt.value = s.id; opt.textContent = `${s.name} — R$${s.price.toFixed(2)}`;
    serviceSelect.appendChild(opt);
  });

  // set min date to today
  function toDateInputValue(date) {
    const local = new Date(date);
    local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return local.toISOString().split('T')[0];
  }
  dateInput.min = toDateInputValue(new Date());

  // storage helpers
  function getBarbers(){ return JSON.parse(localStorage.getItem('bd_barbers')||'[]'); }
  function setBarbers(arr){ localStorage.setItem('bd_barbers', JSON.stringify(arr)); renderBarbers(); renderBarberOptions(); }
  function getBookings(){ return JSON.parse(localStorage.getItem('bd_bookings')||'[]'); }
  function setBookings(arr){ localStorage.setItem('bd_bookings', JSON.stringify(arr)); }

  // render barbers area
  function renderBarbers(){
    const arr = getBarbers();
    barbersListEl.innerHTML = '';
    if(arr.length===0){ barbersListEl.innerHTML='<p>Nenhum barbeiro cadastrado. Acesse o painel /admin para adicionar.</p>'; return; }
    arr.forEach(b=>{
      const div=document.createElement('div'); div.className='barber-item';
      div.innerHTML=`<strong>${b.name}</strong><p>${b.desc||''}</p>`;
      barbersListEl.appendChild(div);
    });
  }

  function renderBarberOptions(){
    barberSelect.innerHTML='';
    const arr = getBarbers();
    const defaultOpt = document.createElement('option'); defaultOpt.value=''; defaultOpt.textContent='Escolha um barbeiro'; barberSelect.appendChild(defaultOpt);
    arr.forEach(b=>{
      const opt = document.createElement('option'); opt.value = b.id; opt.textContent = b.name; barberSelect.appendChild(opt);
    });
  }

  // when date or barber/service changes, compute available times
  function computeAvailableTimes(){
    timeSelect.innerHTML='';
    const date = dateInput.value;
    const barberId = barberSelect.value;
    if(!date || !barberId) return;
    const d = new Date(date + 'T00:00:00');
    const day = d.getDay();
    if(!WORKING.days.includes(day)){ timeSelect.innerHTML='<option>Dia não atendido</option>'; return; }
    // generate hourly slots between start and end
    const slots = [];
    for(let h=WORKING.start; h<WORKING.end; h++){
      slots.push(`${String(h).padStart(2,'0')}:00`);
      slots.push(`${String(h).padStart(2,'0')}:30`);
    }
    // filter out booked slots for the barber
    const bookings = getBookings().filter(b=> b.barberId===barberId && b.date===date);
    const bookedTimes = bookings.map(b=>b.time);
    const avail = slots.filter(s=> !bookedTimes.includes(s));
    if(avail.length===0){ timeSelect.innerHTML='<option>Nenhum horário disponível</option>'; return; }
    avail.forEach(t=>{ const o=document.createElement('option'); o.value=t; o.textContent=t; timeSelect.appendChild(o); });
  }

  dateInput.addEventListener('change', computeAvailableTimes);
  barberSelect.addEventListener('change', ()=>{ computeAvailableTimes(); });

  confirmBtn.addEventListener('click', ()=>{
    const service = serviceSelect.value; const barberId = barberSelect.value; const date = dateInput.value; const time = timeSelect.value;
    if(!service || !barberId || !date || !time){ bookingMsg.style.color='red'; bookingMsg.textContent='Preencha todos os campos.'; return; }
    const bookings = getBookings();
    bookings.push({id:Date.now().toString(),service,barberId,date,time});
    setBookings(bookings);
    bookingMsg.style.color='green'; bookingMsg.textContent='Agendamento confirmado! Você receberá contato para confirmação.';
    // optionally open whatsapp with prefilled message
    const svc = SERVICES.find(s=>s.id===service).name;
    const barber = getBarbers().find(b=>b.id===barberId)?.name||'';
    const phone = '5531990819093';
    const text = encodeURIComponent(`Olá, gostaria de confirmar meu agendamento: Serviço: ${svc}, Barbeiro: ${barber}, Data: ${date}, Horário: ${time}`);
    // Open WhatsApp in a small delay (commented out; uncomment if desired)
    // window.open('https://wa.me/'+phone+'?text='+text, '_blank');
    computeAvailableTimes();
  });

  // header button scroll
  document.getElementById('scroll-to-book').addEventListener('click', ()=>{
    document.getElementById('booking').scrollIntoView({behavior:'smooth'});
  });

  // admin entry
  document.getElementById('open-admin').addEventListener('click', ()=>{
    window.location.href = 'admin.html';
  });

  // initial render
  renderBarbers();
  renderBarberOptions();
  computeAvailableTimes();
})();
