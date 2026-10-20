const { startFixture } = require('./user-flow-fixture.cjs');
(async () => {
  const f = await startFixture({ port: 4411, databaseName: 'cleanpro_admin_retest_browser' });
  const { hashPassword } = require('../src/infrastructure/security/password');
  const user = await f.models.User.create({ name: 'Aisha QA', email: 'customer@example.test', phone: '+97455550123', passwordHash: await hashPassword('Laundry123!'), isSpecial: true });
  const api = async (method, path, body, token) => { if (method === 'POST' && ['/agents', '/admins'].includes(path)) { await f.request('POST', `${path}/otp/request`, { email: body.email }, token); body = { ...body, otpCode: f.mailbox.get(body.email) }; } const r = await f.request(method, path, body, token); if(r.status >= 400) throw Error(JSON.stringify(r)); return r.body?.data; };
  const admin = (await api('POST','/auth/login/admin',{email:'admin@example.test',password:'TestAdmin1!'})).tokens.accessToken;
  const customer = (await api('POST','/auth/login/user',{email:user.email,password:'Laundry123!'})).tokens.accessToken;
  for (let n=1;n<=2;n++) await api('POST','/agents',{name:`QA Agent ${n}`,email:`agent${n}@example.test`,phone:`+9745555012${n}`,password:'Laundry123!',place:'Al Sadd, Doha'},admin);
  const address = await api('POST','/users/me/addresses',{label:'Home',line1:'QA Building Flat 12',line2:'Al Sadd, Doha',city:'Doha',lat:25.2854,lng:51.531},customer);
  const normal = await api('POST','/requests',{addressId:address.id,items:[{name:'Shirt',service:'wash',qty:2,price:10}],note:'Regular QA pickup'},customer);
  const special = await api('POST','/special-requests',{addressId:address.id,deliveryType:'fast',note:'Direct QA pickup'},customer);
  await api('POST','/offers',{code:'QA20',label:'QA Welcome',discount:'20%',active:true},admin);
  console.log(JSON.stringify({base:f.base,regular:normal.code,direct:special.code}));
  process.on('SIGINT',async()=>{await f.stop();process.exit()});
})().catch(e=>{console.error(e);process.exit(1)});
