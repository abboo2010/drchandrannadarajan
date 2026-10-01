/* ============================================================
   IR@SABAH FAQ chatbot — wording & keywords (rule-based, no AI).
   Condition / treatment answers are NOT written here: chatbot.js reads
   them live from CONDITIONS / TREATMENTS (content-data.js, refreshed from
   the CMS), so the bot only ever repeats text already reviewed for the site.
   Only the general FAQs, button labels and disclaimer live in this file.
   Languages: en, bm, zh  (same keys as the rest of the site).
   ============================================================ */
window.CHATBOT_DATA = {

  ui: {
    en: {
      title: 'IR@SABAH Assistant',
      sub: 'Quick answers · not medical advice',
      open: 'Open chat',
      close: 'Close chat',
      placeholder: 'Type your question…',
      send: 'Send',
      welcome: 'Hello! 👋 I can answer common questions about Dr. Chandran\'s conditions, treatments and how to book. Tap a topic below or type your question.',
      disclaimer: 'This assistant gives general information only. It cannot diagnose or replace a consultation with the doctor.',
      menu: 'Main menu',
      more: 'Ask something else',
      noMatch: 'Sorry, I don\'t have an answer for that. For a reliable answer, please message the clinic directly on WhatsApp.',
      pickCond: 'Which condition would you like to know about?',
      pickTreat: 'Which treatment would you like to know about?',
      didYouMean: 'Did you mean one of these?',
      seeMore: 'See full details',
      wa: 'WhatsApp the clinic',
      book: 'Book an appointment',
      sec: { overview: 'Overview', symptoms: 'Symptoms', causes: 'Causes', diagnosis: 'Diagnosis', steps: 'How it works', benefits: 'Benefits', recovery: 'Recovery' },
      topics: { cond: 'Conditions', treat: 'Treatments', book: 'Book / Contact', about: 'About the doctor', ir: 'What is interventional radiology?' },
      urgent: '⚠️ If this is an emergency (e.g. sudden weakness, trouble speaking, chest pain, severe bleeding or breathlessness), please call 999 or go to the nearest emergency department now. Do not wait for a chat reply.'
    },
    bm: {
      title: 'Pembantu IR@SABAH',
      sub: 'Jawapan pantas · bukan nasihat perubatan',
      open: 'Buka sembang',
      close: 'Tutup sembang',
      placeholder: 'Taip soalan anda…',
      send: 'Hantar',
      welcome: 'Helo! 👋 Saya boleh menjawab soalan lazim tentang penyakit, rawatan dan cara membuat temujanji dengan Dr. Chandran. Pilih topik di bawah atau taip soalan anda.',
      disclaimer: 'Pembantu ini hanya memberi maklumat umum. Ia tidak boleh mendiagnosis atau menggantikan konsultasi dengan doktor.',
      menu: 'Menu utama',
      more: 'Tanya soalan lain',
      noMatch: 'Maaf, saya tiada jawapan untuk soalan itu. Untuk jawapan yang tepat, sila mesej klinik terus melalui WhatsApp.',
      pickCond: 'Penyakit manakah yang anda ingin tahu?',
      pickTreat: 'Rawatan manakah yang anda ingin tahu?',
      didYouMean: 'Adakah anda maksudkan salah satu ini?',
      seeMore: 'Lihat butiran penuh',
      wa: 'WhatsApp klinik',
      book: 'Buat temujanji',
      sec: { overview: 'Gambaran keseluruhan', symptoms: 'Simptom', causes: 'Punca', diagnosis: 'Diagnosis', steps: 'Cara ia berfungsi', benefits: 'Manfaat', recovery: 'Pemulihan' },
      topics: { cond: 'Penyakit', treat: 'Rawatan', book: 'Temujanji / Hubungi', about: 'Tentang doktor', ir: 'Apakah radiologi intervensi?' },
      urgent: '⚠️ Jika ini kecemasan (cth. lemah tiba-tiba, sukar bercakap, sakit dada, pendarahan teruk atau sesak nafas), sila hubungi 999 atau pergi ke jabatan kecemasan terdekat sekarang. Jangan tunggu balasan sembang.'
    },
    zh: {
      title: 'IR@SABAH 小助手',
      sub: '快速解答 · 并非医疗建议',
      open: '打开聊天',
      close: '关闭聊天',
      placeholder: '请输入你的问题…',
      send: '发送',
      welcome: '你好！👋 我可以回答关于陈医生的病症、治疗和预约的常见问题。请点选下面的主题，或直接输入问题。',
      disclaimer: '本助手只提供一般资讯，不能诊断，也不能代替医生的诊症。',
      menu: '主菜单',
      more: '问其他问题',
      noMatch: '不好意思，我暂时没有这个问题的答案。想要准确的回答，请直接 WhatsApp 联络诊所。',
      pickCond: '你想了解哪一种病症？',
      pickTreat: '你想了解哪一种治疗？',
      didYouMean: '你是不是想问以下其中一项？',
      seeMore: '查看完整资料',
      wa: 'WhatsApp 诊所',
      book: '预约看诊',
      sec: { overview: '简介', symptoms: '症状', causes: '成因', diagnosis: '诊断', steps: '治疗过程', benefits: '好处', recovery: '康复' },
      topics: { cond: '病症', treat: '治疗', book: '预约 / 联络', about: '关于医生', ir: '什么是介入放射学？' },
      urgent: '⚠️ 如果是紧急情况（例如突然手脚无力、说话困难、胸痛、严重出血或呼吸困难），请立刻拨打 999 或前往最近的急诊部门，不要等聊天回复。'
    }
  },

  /* General FAQs. `kw` = lowercase keywords/phrases matched against the visitor's
     message (any hit scores; more hits rank higher). Chinese keywords are matched
     as substrings, so short words are fine. `a` = the answer shown. */
  faqs: [
    {
      id: 'book',
      kw: {
        en: ['book', 'appointment', 'appoint', 'consult', 'see the doctor', 'visit', 'schedule', 'contact', 'phone', 'call', 'whatsapp', 'email', 'reach'],
        bm: ['temujanji', 'temu janji', 'buat janji', 'tempah', 'jumpa doktor', 'hubungi', 'telefon', 'whatsapp', 'emel', 'konsultasi'],
        zh: ['预约', '约', '挂号', '看诊', '看医生', '联络', '联系', '电话', 'whatsapp', '邮件']
      },
      a: {
        en: 'The fastest way to book is WhatsApp: +60 12-477 5257. Tell the clinic what you need and they will reply with available dates and times. You can also email drnchandran23@gmail.com.',
        bm: 'Cara paling pantas untuk membuat temujanji ialah melalui WhatsApp: +60 12-477 5257. Beritahu klinik keperluan anda dan mereka akan membalas dengan tarikh dan masa yang tersedia. Anda juga boleh emel ke drnchandran23@gmail.com.',
        zh: '最快的预约方式是 WhatsApp：+60 12-477 5257。告诉诊所你的需要，他们会回复可预约的日期和时间。你也可以电邮至 drnchandran23@gmail.com。'
      },
      cta: 'wa'
    },
    {
      id: 'ir',
      kw: {
        en: ['interventional radiology', 'interventional radiologist', 'what is ir', 'minimally invasive', 'image-guided', 'image guided', 'radiologist', 'no surgery', 'without surgery', 'keyhole'],
        bm: ['radiologi intervensi', 'pakar radiologi', 'invasif minimum', 'berpandukan imej', 'tanpa pembedahan', 'tanpa bedah'],
        zh: ['介入', '放射科', '微创', '影像引导', '不用开刀', '免开刀', '无需手术']
      },
      a: {
        en: 'Interventional radiology uses imaging such as ultrasound, X-ray and CT to guide very thin tubes or needles through a tiny cut in the skin to treat the problem from the inside. Compared with open surgery it usually means smaller wounds, less pain and a quicker recovery. Whether it suits you depends on your condition, which the doctor will assess.',
        bm: 'Radiologi intervensi menggunakan pengimejan seperti ultrabunyi, X-ray dan CT untuk memandu tiub atau jarum yang sangat halus melalui potongan kecil pada kulit bagi merawat masalah dari dalam. Berbanding pembedahan terbuka, ia biasanya bermakna luka lebih kecil, kurang sakit dan pemulihan lebih cepat. Sama ada ia sesuai bergantung pada keadaan anda, yang akan dinilai oleh doktor.',
        zh: '介入放射学是利用超声波、X光和CT等影像做引导，让很细的导管或针从皮肤上一个小切口进入身体，从里面治疗问题。和传统开刀相比，伤口通常较小、痛楚较少、康复也较快。适不适合你，要由医生评估你的情况才能决定。'
      }
    },
    {
      id: 'about',
      kw: {
        en: ['who is', 'doctor', 'dr chandran', 'chandran', 'qualification', 'qualifications', 'experience', 'credential', 'trained', 'training', 'about'],
        bm: ['siapa', 'doktor', 'kelayakan', 'pengalaman', 'latihan', 'tentang'],
        zh: ['医生', '陈医生', '资历', '学历', '经验', '背景', '关于']
      },
      a: {
        en: 'Dr. Chandran Nadarajan is a Consultant Clinical & Interventional Radiologist based in Sabah. His full background and credentials are on the About the Doctor page.',
        bm: 'Dr. Chandran Nadarajan ialah Pakar Perunding Radiologi Klinikal & Intervensi yang berpusat di Sabah. Latar belakang dan kelayakan penuhnya ada di halaman Tentang Doktor.',
        zh: '陈医生（Dr. Chandran Nadarajan）是驻守沙巴的临床及介入放射科顾问医生。他的完整背景和资历请看「关于医生」页面。'
      },
      link: { href: '/about', label: { en: 'About the Doctor', bm: 'Tentang Doktor', zh: '关于医生' } }
    },
    {
      id: 'safe',
      kw: {
        en: ['safe', 'risk', 'side effect', 'complication', 'pain', 'hurt', 'anaesthesia', 'anesthesia', 'sedation', 'recover', 'recovery', 'hospital stay', 'how long'],
        bm: ['selamat', 'risiko', 'kesan sampingan', 'komplikasi', 'sakit', 'bius', 'pemulihan', 'tempoh', 'berapa lama'],
        zh: ['安全', '风险', '副作用', '并发症', '痛', '麻醉', '康复', '恢复', '住院', '多久']
      },
      a: {
        en: 'Every procedure has benefits and risks, and recovery time differs from one treatment to another. Pick a treatment from the Treatments menu to read its recovery notes. Risks and suitability for you can only be explained properly by the doctor after assessing you, so please book a consultation for personal advice.',
        bm: 'Setiap prosedur mempunyai manfaat dan risiko, dan tempoh pemulihan berbeza antara satu rawatan dengan yang lain. Pilih rawatan daripada menu Rawatan untuk membaca nota pemulihannya. Risiko dan kesesuaian untuk anda hanya dapat dijelaskan dengan betul oleh doktor selepas menilai anda, jadi sila buat temujanji untuk nasihat peribadi.',
        zh: '每一种治疗都有好处和风险，康复时间也各不相同。你可以在「治疗」菜单选择某项治疗，查看它的康复说明。至于风险和是否适合你，必须由医生评估后才能好好解释，所以想要个人建议，请预约看诊。'
      },
      cta: 'wa'
    },
    {
      id: 'cost',
      kw: {
        en: ['cost', 'price', 'fee', 'charge', 'how much', 'insurance', 'cover', 'payment', 'package'],
        bm: ['kos', 'harga', 'yuran', 'bayaran', 'berapa', 'insurans', 'pakej'],
        zh: ['费用', '价钱', '收费', '多少钱', '保险', '付款', '配套']
      },
      a: {
        en: 'Fees depend on the condition and the procedure, so they can\'t be quoted in chat. Please WhatsApp the clinic and they will advise you on fees and on insurance matters.',
        bm: 'Yuran bergantung pada penyakit dan prosedur, jadi ia tidak dapat dinyatakan dalam sembang ini. Sila WhatsApp klinik dan mereka akan memberi maklumat tentang yuran dan insurans.',
        zh: '费用要看病情和所做的治疗，所以无法在聊天里报价。请直接 WhatsApp 诊所，他们会告诉你费用和保险方面的详情。'
      },
      cta: 'wa'
    },
    {
      id: 'location',
      kw: {
        en: ['where', 'location', 'address', 'clinic', 'hospital', 'directions', 'map', 'open', 'opening hours', 'hours', 'time'],
        bm: ['mana', 'lokasi', 'alamat', 'klinik', 'hospital', 'arah', 'waktu operasi', 'buka', 'jam'],
        zh: ['地点', '地址', '在哪', '哪里', '诊所', '医院', '路线', '营业', '时间', '几点']
      },
      a: {
        en: 'For the clinic location and consultation hours, please check the Contact page or WhatsApp the clinic at +60 12-477 5257 so you get the most up-to-date details.',
        bm: 'Untuk lokasi klinik dan waktu konsultasi, sila lihat halaman Hubungi atau WhatsApp klinik di +60 12-477 5257 supaya anda mendapat maklumat terkini.',
        zh: '诊所的地点和看诊时间，请查看「联络」页面，或 WhatsApp 诊所 +60 12-477 5257，这样可以得到最新的资料。'
      },
      link: { href: '/contact', label: { en: 'Contact page', bm: 'Halaman Hubungi', zh: '联络页面' } },
      cta: 'wa'
    },
    {
      id: 'language',
      kw: {
        en: ['language', 'bahasa', 'chinese', 'malay', 'english', 'translate'],
        bm: ['bahasa', 'cina', 'melayu', 'inggeris', 'terjemah'],
        zh: ['语言', '中文', '华语', '马来文', '英文', '翻译']
      },
      a: {
        en: 'This website and this assistant work in English, Bahasa Malaysia and Chinese. Use the language buttons at the top of the page to switch.',
        bm: 'Laman web dan pembantu ini boleh digunakan dalam Bahasa Inggeris, Bahasa Malaysia dan Bahasa Cina. Gunakan butang bahasa di bahagian atas halaman untuk menukar.',
        zh: '这个网站和小助手有英文、马来文和中文三种语言。请用页面上方的语言按钮切换。'
      }
    }
  ],

  /* Words that mean "this may be an emergency" — the bot shows the `urgent`
     notice before anything else when it sees one of these. */
  urgentKw: {
    en: ['emergency', 'urgent', 'chest pain', "can't breathe", 'cannot breathe', 'short of breath', 'breathless', 'sudden weakness', 'slurred', 'bleeding heavily', 'severe bleeding', 'coughing blood', 'collapsed', 'unconscious'],
    bm: ['kecemasan', 'kecemasan', 'sakit dada', 'sesak nafas', 'tidak boleh bernafas', 'lemah tiba-tiba', 'pelat', 'pendarahan teruk', 'batuk berdarah', 'pengsan'],
    zh: ['紧急', '急救', '胸痛', '呼吸困难', '喘不过气', '突然无力', '口齿不清', '大量出血', '严重出血', '咳血', '昏倒', '晕倒']
  }
};
