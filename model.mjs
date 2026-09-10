import config from './config.mjs';
export const storageKey = `lyre-${config.id}-v1`;
export function validateRecord(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Invalid record.');
  const allowed = ['id', ...config.fields.map(([key]) => key)];
  if (Object.keys(input).some(key => !allowed.includes(key))) throw Error('Unexpected record field.');
  if (typeof input.id !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(input.id)) throw Error('Invalid record ID.');
  const result = { id: input.id };
  for (const [key, label, type, options] of config.fields) {
    const value = input[key];
    if (type === 'number' || type === 'money') {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1000000 || (type === 'number' && !Number.isInteger(value)) || (type === 'money' && Math.abs(value*100-Math.round(value*100))>0.00001)) throw Error(`${label} must be a valid non-negative ${type === 'number' ? 'whole number' : 'amount (two decimals)'}.`);
    } else {
      if (typeof value !== 'string' || value.length > (type === 'textarea' ? 10000 : 160)) throw Error(`${label} is too long or invalid.`);
      if (type !== 'textarea' && !value.trim()) throw Error(`${label} is required.`);
      if (options && !options.includes(value)) throw Error(`${label} is not a supported option.`);
      if (type === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10)!==value)) throw Error('Enter a valid date.');
    }
    result[key] = typeof value === 'string' ? value.trim() : value;
  }
  return result;
}
export function validateBackup(value) {
  if (!value || value.schemaVersion !== 1 || value.app !== config.id || !Array.isArray(value.records) || value.records.length > 2000 || typeof value.sample !== 'boolean' || Object.keys(value).some(key => !['schemaVersion','app','records','sample'].includes(key))) throw Error(`Choose a valid ${config.name} backup (up to 2,000 records).`);
  const records = value.records.map(validateRecord);
  if(new Set(records.map(record=>record.id)).size!==records.length)throw Error('Backup contains duplicate IDs.');
  return {schemaVersion:1,app:config.id,sample:value.sample,records};
}
export function initialState() {
  return validateBackup({schemaVersion:1,app:config.id,sample:true,records:config.samples.map((values,index)=>({id:`sample-${index+1}`,...Object.fromEntries(config.fields.map(([key],i)=>[key,values[i]]))}))});
}
export function upsert(state, record) {
  const checked=validateRecord(record);
  const exists=state.records.some(item=>item.id===record.id);
  return validateBackup({...state,records:exists?state.records.map(item=>item.id===record.id?checked:item):[checked,...state.records]});
}
export function save(storage, state) {
  const checked=validateBackup(state);
  storage.setItem(storageKey,JSON.stringify(checked));
  return checked;
}
