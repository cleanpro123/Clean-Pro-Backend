const assert = require('node:assert/strict');
const { test } = require('node:test');
const { startAgentFixture } = require('./agent-flow-fixture.cjs');
test('Agent journeys against isolated MongoDB and real HTTP routes', async t => {
  const f = await startAgentFixture(); t.after(()=>f.stop());
  const call = async(method,path,body,token,status=200)=>{const r=await f.request(method,path,body,token);assert.equal(r.status,status,`${method} ${path}: ${JSON.stringify(r.body)}`);return r.body.data;};
  const login = async(role,email,password=f.password)=>(await call('POST',`/auth/login/${role}`,{email,password})).tokens.accessToken;
  const agent = await login('agent',f.agent.email), admin = await login('admin','admin@example.test','TestAdmin1!'), user = await login('user',f.user.email);
  await t.test('1: agent credentials succeed; customer/admin credentials fail at agent login',async()=>{
    assert.equal((await call('GET','/auth/me',undefined,agent)).role,'agent');
    for(const [email,password] of [[f.user.email,f.password],['admin@example.test','TestAdmin1!'],[f.agent.email,'Wrong123!']]) await call('POST','/auth/login/agent',{email,password},null,401);
    await call('GET','/requests/assigned',undefined,user,403);await call('GET','/requests/assigned',undefined,admin,403);
  });
  for(const kind of ['normal','special']) {
    const base=kind==='normal'?'/requests':'/special-requests', order=f.orders[kind][0];
    await t.test(`2–4: ${kind}: all assigned pages, details, status buckets, no leaks or duplicates`,async()=>{
      const rows=[]; for(let page=1;page<=2;page++) rows.push(...await call('GET',`${base}/assigned?limit=50&page=${page}`,undefined,agent));
      assert.equal(rows.length,60);assert.equal(new Set(rows.map(r=>r.id)).size,60);
      for(const status of ['pending','accepted','in_progress','out_for_delivery','delivered','cancelled']) assert.equal(rows.filter(r=>r.status===status).length,10);
      for(const id of [f.orders[kind+'Other'].id,f.orders[kind+'Unassigned'].id]){
        assert.ok(!rows.some(r=>r.id===id));await call('GET',`${base}/${id}`,undefined,agent,403);
        await call('PATCH',`${base}/${id}/status`,{status:'accepted'},agent,403);await call('PATCH',`${base}/${id}/total`,{total:100},agent,403);
      }
      const detail=await call('GET',`${base}/${order.id}`,undefined,agent);
      assert.equal(detail.userId.id,f.user.id);assert.equal(detail.addressId.id,f.address.id);assert.equal(detail.note,order.note);
      assert.equal(detail.kind,kind==='special'?'special':undefined);assert.equal(detail.items.length,kind==='special'?0:1);
    });
    await t.test(`5: ${kind}: populated customer, phone, pickup address and coordinates`,async()=>{
      const detail=await call('GET',`${base}/${order.id}`,undefined,agent);assert.equal(detail.userId.name,'QA Customer');assert.equal(detail.userId.phone,f.user.phone);assert.equal(detail.addressId.city,'Doha');assert.equal(detail.addressId.lat,25.2854);
    });
    await t.test(`6,10: ${kind}: full status lifecycle, replay safe, visible to admin and customer`,async()=>{
      for(const status of ['accepted','in_progress','out_for_delivery','delivered']){
        const updated=await call('PATCH',`${base}/${order.id}/status`,{status},agent);
        const replay=await call('PATCH',`${base}/${order.id}/status`,{status},agent);assert.equal(replay.updatedAt,updated.updatedAt);
        for(const token of [admin,user]) assert.equal((await call('GET',`${base}/${order.id}`,undefined,token)).status,status);
        assert.equal((await call('GET',`${base}/mine?limit=100`,undefined,user)).find(r=>r.id===order.id)?.status,status);
      }
      await call('PATCH',`${base}/${order.id}/status`,{status:'accepted'},agent,400);
    });
    await t.test(`7: ${kind}: permitted price edits, invalid prices, completed/cancelled protection`,async()=>{
      const editable=f.orders[kind][1];await call('PATCH',`${base}/${editable.id}/total`,{total:42.75},agent);
      for(const token of [admin,user]) assert.equal((await call('GET',`${base}/${editable.id}`,undefined,token)).total,42.75);
      for(const total of [-1,'bad']) await call('PATCH',`${base}/${editable.id}/total`,{total},agent,400);
      for(const locked of [order,f.orders[kind][4],f.orders[kind][5]]){
        for(const token of [agent,admin]) await call('PATCH',`${base}/${locked.id}/total`,{total:999},token,400);
      }
      const pending=f.orders[kind][6]; await call('PATCH',`${base}/${pending.id}/status`,{status:'delivered'},agent,400);
    });
  }
});
