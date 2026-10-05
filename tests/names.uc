import * as fs from 'fs';
import { read_names, save_name } from '../packages/luci-app-rmm-dashboard/root/usr/share/ucode/rmm-dashboard/names.uc';
let directory=sprintf('/tmp/rmm-dashboard-names-%d',time());
if (!fs.mkdir(directory,0700)) die(fs.error());
let path=directory+'/names.json', mac='02:00:00:00:00:09';
function assert(ok,message) { if (!ok) die(message); }
function rejected(fn,message) { let failed=false;try { fn(); }catch(err) { failed=true; }assert(failed,message); }
try {
    assert(length(read_names(path))==0,'Missing storage must be empty');
    save_name(path,lc(mac),'Мой компьютер','');
    assert(read_names(path)[mac]=='Мой компьютер','Name did not persist');
    assert(fs.stat(path).mode==384,'Storage must have 0600 permissions');
    save_name(path,'02:00:00:00:00:10','NAS','');
    let long_name='';for(let i=0;i<129;i++)long_name+='я';
    assert(length(long_name)==258,'UTF-8 byte fixture incorrect');
    rejected(()=>save_name(path,mac,long_name,'Мой компьютер'),'UTF-8 byte limit not enforced');
    fs.mkdir(path+'.lock',0700);
    rejected(()=>save_name(path,mac,'Busy','Мой компьютер'),'Concurrent writer lock ignored');
    fs.rmdir(path+'.lock');
    fs.symlink(path,directory+'/link');
    rejected(()=>read_names(directory+'/link'),'Symlink storage accepted');
    fs.unlink(directory+'/link');
    rejected(()=>save_name(path,mac,'Lost update',''),'Concurrent edit was not rejected');
    rejected(()=>save_name(path,'ff:ff:ff:ff:ff:ff','Invalid',''),'Multicast MAC accepted');
    rejected(()=>save_name(path,mac,'Bad\nName','Мой компьютер'),'Control character accepted');
    assert(read_names(path)[mac]=='Мой компьютер','Rejected edit lost previous data');
    save_name(path,mac,'','Мой компьютер');
    assert(!read_names(path)[mac] && read_names(path)['02:00:00:00:00:10']=='NAS','Removal affected other names');
    fs.writefile(path,'broken');
    rejected(()=>save_name(path,mac,'Overwrite',''),'Corrupt storage overwritten');
    assert(fs.readfile(path)=='broken','Corrupt storage was not preserved');
    print('Persistent client names: passed\n');
}
catch(err) { fs.unlink(path);fs.rmdir(directory);die(err); }
fs.unlink(path);fs.rmdir(directory);
