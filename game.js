// phina.js をグローバル領域に展開
phina.globalize();

// 何かで使う定数値(バランス調整でいじっていい値)
const PLAYER_POSITION_Y = 550;  //自機の縦位置
const PLAYER_DEFAULT_SPEED = 2; //自機の移動スピード
const BULLET_DEFAULT_SPEED = 5; //自機が発射する弾のスピード

// MainScene クラスを定義
phina.define('MainScene', {
    superClass: 'DisplayScene',
    init: function (option) {
        this.superInit(option);
        // 背景色を指定
        this.backgroundColor = 'black';

        // 自機を生成
        this.player = Player({
            image: 'player',
            x: this.gridX.center(),
            y: PLAYER_POSITION_Y,
            speed: PLAYER_DEFAULT_SPEED,
            bulletSpeed: BULLET_DEFAULT_SPEED
        }).addChildTo(this);

        // 敵のグループ作成
        const enemies = EnemyGroup({
            x: 35,
            y: 35,
            offsetX: 80,
            offsetY: 50,
            lengthX: 8,
            lengthY: 5,
            player: this.player
        }).addChildTo(this);
    }
});

// 自機クラス
phina.define('Player', {
    superClass: 'Sprite',

    init: function (option) {
        this.superInit(option.image);
        this.x = option.x;
        this.y = option.y;
        this.speed = option.speed;
        this.bulletSpeed = option.bulletSpeed;
        this.bullet = null;
    },

    update: function (app) {
        const key = app.keyboard;
        // キー入力に合わせて移動
        this.move(key);

        // スペースキーが押されていたら弾発射
        if (key.getKey('space')) {
            this.shot();
        }
        // 弾の有効チェック
        if (this.bullet !== null && !this.bullet.isAwake()) {
            this.bullet = null;
        }
    },

    move: function (key) {
        if (key.getKey('left')) {
            this.x -= this.speed;
        }
        if (key.getKey('right')) {
            this.x += this.speed;
        }

        // 画面外に行かないよう制御
        if (this.left < 0) {
            this.left = 0;
        }
        if (this.right > 800) {
            this.right = 800;
        }
    },

    shot: function () {
        if (this.bullet != null) {
            return;
        }
        this.bullet = Bullet({
            x: this.x,
            y: this.top,
            speed: this.bulletSpeed
        }).addChildTo(this.parent);
    },
});

// 弾クラスを作る
phina.define('Bullet', {
    superClass: 'Shape',
    init: function (option) {
        this.superInit({
            width: 2,
            height: 10,
            padding: 0,
            backgroundColor: '#ddd',
            x: option.x,
            y: option.y,
        });
        this.speed = option.speed;
    },

    update: function (app) {
        this.y -= this.speed;
        if (this.y < 0) {
            this.flare('hit');
        }
    },

    onhit: function () {
        this.remove();
        this.sleep();
    }
});

// 敵クラスを作る
phina.define('Enemy', {
    superClass: 'Sprite',

    init: function (option) {
        this.superInit(option.image);
        this.x = option.x;
        this.y = option.y;
    }
});

// 敵グループクラスを作る
phina.define('EnemyGroup', {
    superClass: 'DisplayElement',

    init: function (option) {
        this.superInit();
        this.x = option.x;
        this.y = option.y;
        this.player = option.player;

        const thisGroup = this;
        Array.range(0, option.lengthY).each(function (iy) {
            Array.range(0, option.lengthX).each(function (ix) {
                const enemy = Enemy({
                    image: 'enemy1',
                    x: ix * option.offsetX,
                    y: (option.lengthY - iy - 1) * option.offsetY
                }).addChildTo(thisGroup);
            });
        });
    },

    update: function (app) {
        // 当たり判定
        const thisGroup = this;
        if (this.player.bullet != null) {
            // 弾のコピーを作ってから座標を変換する。
            let bullet = Bullet(this.player.bullet);
            let translate = thisGroup.globalToLocal(bullet);
            bullet.moveTo(translate.x, translate.y);
            this.children.forEach(function (enemy) {
                if (bullet === null) {
                    return;
                }
                if (enemy.hitTestElement(bullet)) {
                    thisGroup.player.bullet.flare('hit');
                    bullet = null;
                    enemy.remove();
                }
            });
        }
    }
});

// アセット
const ASSETS = {
    image: {
        player: './image/player.png',
        enemy1: './image/enemy.png'
    }
};

// メイン処理
phina.main(function () {
    const app = GameApp({
        startLabel: 'main',
        assets: ASSETS,
        domElement: document.getElementById('display'),
        width: 800,
        height: 600,
        fps: 60,
        fit: false,
    });

    // app.enableStats();
    app.run();
});