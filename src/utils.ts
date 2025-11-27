const max_len=5;

export function generate(){
    let id="";

    let subjects="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(let i=0;i<max_len;i++){
        let idx=Math.floor(Math.random()*subjects.length);
        id+=subjects[idx];
    }
    return id;
}

