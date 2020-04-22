'use strict';

window.onload = () => {
    const cvs = document.getElementById('k-touch-diend');
    const ctx = cvs.getContext('2d');
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();

    let state = 0;

    const flags = {
        2001: false,
        2002: false,
        2003: false,
        2004: false,
        2005: false,
        2006: false,
        2008: false,
        2009: false
    };

    class Sprite {
        constructor(centerX, centerY, image) {
            this.centerX = centerX;
            this.centerY = centerY;
            this.angle = 0;
            this.visible = true;
            this.img = image;
        }
    }

    const pngFiles = {
        LED0: 'images/led-0.png',
        LED1: 'images/led-1.png',
        screen: 'images/screen.png'
    };

    const images = {};
    for (let key in pngFiles) {
        images[key] = new Image();
        images[key].src = pngFiles[key];
    }

    const LEDs = {};
    LEDs['2001'] = new Sprite(90, 90, images['LED0']);
    LEDs['2002'] = new Sprite(90, 270, images['LED0']);
    LEDs['2003'] = new Sprite(90, 450, images['LED0']);
    LEDs['2004'] = new Sprite(450, 90, images['LED0']);
    LEDs['2005'] = new Sprite(270, 90, images['LED0']);
    LEDs['2006'] = new Sprite(450, 270, images['LED0']);
    LEDs['2008'] = new Sprite(270, 270, images['LED0']);
    LEDs['2009'] = new Sprite(450, 450, images['LED0']);
    const screen = new Sprite(360, 270, images['screen']);

    const sprites = [];
    for (let key in LEDs) {
        sprites.push(LEDs[key]);
    }
    sprites.push(screen);

    const updateView = () => {
        ctx.clearRect(0, 0, 720, 540);
        for (let spr of sprites) {
            if (spr.visible == true) {
                ctx.save();
                ctx.translate(spr.centerX, spr.centerY);
                ctx.rotate(spr.angle * Math.PI / 180);
                ctx.drawImage(spr.img, -spr.img.width / 2, -spr.img.height / 2);
                ctx.restore();
            }
        }
    };

    const unlockAudioCtx = () => {
        audioCtx.resume().then(() => {
            cvs.removeEventListener('mousedown', unlockAudioCtx);
            cvs.removeEventListener('touchstart', unlockAudioCtx);
            cvs.removeEventListener('touchend', unlockAudioCtx);
        });
    };

    if (audioCtx.state === 'suspended') {
        cvs.addEventListener('mousedown', unlockAudioCtx);
        cvs.addEventListener('touchstart', unlockAudioCtx);
        cvs.addEventListener('touchend', unlockAudioCtx);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            if (audioCtx.state !== 'running') {
                cvs.addEventListener('mousedown', unlockAudioCtx);
                cvs.addEventListener('touchstart', unlockAudioCtx);
                cvs.addEventListener('touchend', unlockAudioCtx);
            }
        }
    });

    const mp3Files = {
        name2001: 'sounds/g4.mp3',
        name2002: 'sounds/ryuga.mp3',
        name2003: 'sounds/orga.mp3',
        name2004: 'sounds/glaive.mp3',
        name2005: 'sounds/kabuki.mp3',
        name2006: 'sounds/caucasus.mp3',
        name2008: 'sounds/arc.mp3',
        name2009: 'sounds/skull.mp3',
        attack: 'sounds/attack-ride.mp3',
        ded: 'sounds/final-kamen-ride.mp3',
        ppp: 'sounds/ring.mp3',
        reset: 'sounds/reset.mp3'
    };

    const audioBuffers = {};
    const promiseArray = [];

    for (let key in mp3Files) {
        const promise = new Promise((resolve, reject) => {
            fetch(mp3Files[key]).then((response) => {
                if (!response.ok) {
                    throw new Error();
                }
                return response.arrayBuffer();
            }).then((arrayBuffer) => {
                audioCtx.decodeAudioData(arrayBuffer, (audioBuffer) => {
                    audioBuffers[key] = audioBuffer;
                    resolve();
                });
            }).catch(() => {
                console.log('無法讀取 ' + mp3Files[key]);
                let div = document.createElement('div');
                div.textContent = '無法讀取 ' + mp3Files[key];
                cvs.parentNode.parentNode.appendChild(div);
            });
        });

        promiseArray.push(promise);
    }

    Promise.all(promiseArray).then(() => {
        updateView();

        for (let key in images) {
            images[key].onload = () => {
                updateView();
            };
        }

        class Button {
            constructor(x, y, w, h) {
                this.x = x;
                this.y = y;
                this.w = w;
                this.h = h;
                this.enabled = true;
                this.action = () => {};
            }
        }

        const btn2001 = new Button(0, 0, 180, 180);
        const btn2002 = new Button(0, 180, 180, 180);
        const btn2003 = new Button(0, 360, 180, 180);
        const btn2004 = new Button(360, 0, 180, 180);
        const btn2005 = new Button(180, 0, 180, 180);
        const btn2006 = new Button(360, 180, 180, 180);
        const btn2008 = new Button(180, 180, 180, 180);
        const btn2009 = new Button(360, 360, 180, 180);
        const btnDED = new Button(540, 180, 180, 180);
        const btnF = new Button(540, 0, 180, 180);
        const btnC = new Button(540, 360, 180, 180);

        const turnAllLEDsOn = () => {
            for (let key in LEDs) {
                LEDs[key].img = images['LED1'];
            }
            updateView();
        };
        const turnAllLEDsOff = () => {
            for (let key in LEDs) {
                LEDs[key].img = images['LED0'];
            }
            updateView();
        };
        const highlight = (labels) => {
            for (let key in LEDs) {
                LEDs[key].img = images['LED0'];
            }
            for (let year of labels) {
                LEDs[year].img = images['LED1'];
            }
            updateView();
        };

        let ringtone = null;

        const commonButtonFunc = (year) => {
            switch (state) {
                case 0: {
                    if (!flags[year]) {
                        flags[year] = true;
                        LEDs[year].img = images['LED1'];
                        const source = audioCtx.createBufferSource();
                        source.buffer = audioBuffers['name' + year];
                        source.connect(audioCtx.destination);
                        source.start(0);

                        let b = true;
                        for (let key in flags) {
                            b = (b && flags[key]);
                            if (!b) break;
                        }

                        if (b) {
                            ringtone = audioCtx.createBufferSource();
                            ringtone.buffer = audioBuffers['ppp'];
                            ringtone.connect(audioCtx.destination);
                            ringtone.start(audioCtx.currentTime + 1.1);

                            const makeSpiral = () => {
                                setTimeout(() => {
                                    highlight(['2001']);
                                }, 100);
                                setTimeout(() => {
                                    highlight(['2002']);
                                }, 200);
                                setTimeout(() => {
                                    highlight(['2003']);
                                }, 300);
                                setTimeout(() => {
                                    turnAllLEDsOff();
                                }, 400);
                                setTimeout(() => {
                                    highlight(['2009']);
                                }, 500);
                                setTimeout(() => {
                                    highlight(['2006']);
                                }, 600);
                                setTimeout(() => {
                                    highlight(['2004']);
                                }, 700);
                                setTimeout(() => {
                                    highlight(['2005']);
                                }, 800);
                                setTimeout(() => {
                                    highlight(['2008']);
                                }, 900);
                            };

                            setTimeout(() => {
                                makeSpiral();
                                let count = 0;
                                setInterval(() => {
                                    if (count < 9) {
                                        count++;
                                        makeSpiral();
                                    } else {
                                        let id = setTimeout(() => {}, 0);
                                        while (id--) {
                                            clearTimeout(id);
                                            clearInterval(id);
                                        }
                                        turnAllLEDsOff();
                                    }
                                }, 1200);
                            }, 1000);
                        }
                    }

                    break;
                }
            }
        };

        btn2001.action = () => {
            commonButtonFunc('2001');
        };
        btn2002.action = () => {
            commonButtonFunc('2002');
        };
        btn2003.action = () => {
            commonButtonFunc('2003');
        };
        btn2004.action = () => {
            commonButtonFunc('2004');
        };
        btn2005.action = () => {
            commonButtonFunc('2005');
        };
        btn2006.action = () => {
            commonButtonFunc('2006');
        };
        btn2008.action = () => {
            commonButtonFunc('2008');
        };
        btn2009.action = () => {
            commonButtonFunc('2009');
        };
        btnDED.action = () => {
            switch (state) {
                case 0: {
                    let b = true;
                    for (let key in flags) {
                        b = (b && flags[key]);
                        if (!b) break;
                    }

                    if (b) {
                        state = 1;

                        for (let key in flags) {
                            flags[key] = false;
                        }

                        let id = setTimeout(() => {}, 0);
                        while (id--) {
                            clearTimeout(id);
                            clearInterval(id);
                        }
                        turnAllLEDsOn();

                        ringtone.stop();
                        const source = audioCtx.createBufferSource();
                        source.buffer = audioBuffers['ded'];
                        source.connect(audioCtx.destination);
                        source.start(0);

                        setTimeout(() => {
                            turnAllLEDsOff();
                        }, 2000);
                        setTimeout(() => {
                            turnAllLEDsOn();
                        }, 2500);
                        setTimeout(() => {
                            turnAllLEDsOff();
                        }, 3000);
                        setTimeout(() => {
                            highlight(['2001', '2005', '2004']);
                        }, 3500);
                        setTimeout(() => {
                            highlight(['2002', '2008', '2006']);
                        }, 4000);
                        setTimeout(() => {
                            highlight(['2003', '2009']);
                        }, 4500);
                        setTimeout(() => {
                            highlight(['2002', '2008', '2006']);
                        }, 5000);
                        setTimeout(() => {
                            highlight(['2001', '2005', '2004']);
                        }, 5500);
                        setTimeout(() => {
                            highlight(['2008']);
                        }, 6000);
                        setTimeout(() => {
                            highlight(['2005']);
                        }, 6200);
                        setTimeout(() => {
                            highlight(['2004']);
                        }, 6400);
                        setTimeout(() => {
                            highlight(['2006']);
                        }, 6600);
                        setTimeout(() => {
                            highlight(['2009']);
                        }, 6800);
                        setTimeout(() => {
                            turnAllLEDsOff();
                        }, 7000);
                        setTimeout(() => {
                            highlight(['2003']);
                        }, 7200);
                        setTimeout(() => {
                            highlight(['2002']);
                        }, 7400);
                        setTimeout(() => {
                            highlight(['2001']);
                        }, 7600);
                        setTimeout(() => {
                            turnAllLEDsOn();
                        }, 7800);
                        setTimeout(() => {
                            turnAllLEDsOff();
                        }, 8000);
                        setTimeout(() => {
                            turnAllLEDsOn();
                        }, 8200);
                        setTimeout(() => {
                            state = 2;
                        }, 9000);
                    }

                    break;
                }
            }
        };
        btnF.action = () => {
            switch (state) {
                case 2: {
                    state = 3;

                    const source = audioCtx.createBufferSource();
                    source.buffer = audioBuffers['attack'];
                    source.connect(audioCtx.destination);
                    source.start(0);

                    setTimeout(() => {
                        state = 2;
                    }, 10000);

                    break;
                }
            }
        };
        btnC.action = () => {
            switch (state) {
                case 2: {
                    state = 0;
                    turnAllLEDsOff();
                    for (let key in flags) {
                        flags[key] = false;
                    }

                    const source = audioCtx.createBufferSource();
                    source.buffer = audioBuffers['reset'];
                    source.connect(audioCtx.destination);
                    source.start(0);

                    break;
                }
            }
        };

        const buttons = [
            btn2001, btn2002, btn2003,
            btn2004, btn2005, btn2006,
            btn2008, btn2009,
            btnDED, btnF, btnC
        ];

        cvs.addEventListener('mousedown', (e) => {
            const rect = cvs.getBoundingClientRect();
            const mX = e.clientX - rect.left;
            const mY = e.clientY - rect.top;

            for (let btn of buttons) {
                if (btn.enabled == true) {
                    if (btn.x <= mX && mX <= btn.x + btn.w && btn.y <= mY && mY <= btn.y + btn.h) {
                        btn.action();
                    }
                }
            }
            updateView();
        });

        cvs.addEventListener('touchstart', (e) => {
            const rect = cvs.getBoundingClientRect();
            const mX = e.touches[0].clientX - rect.left;
            const mY = e.touches[0].clientY - rect.top;
            e.preventDefault();

            for (let btn of buttons) {
                if (btn.enabled == true) {
                    if (btn.x <= mX && mX <= btn.x + btn.w && btn.y <= mY && mY <= btn.y + btn.h) {
                        btn.action();
                    }
                }
            }
            updateView();
        });
    });
};