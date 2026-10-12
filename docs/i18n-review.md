# Kiswahili review (decision 10)

First-draft Kiswahili written by the agent. A native speaker sets `reviewed` to `true` and adds their initials. Editing a Kiswahili string resets it to `false` when this file is regenerated (`npm run i18n:review`).

Guidance: short, concrete sentences; read at about an 11-year-old level; avoid literal translation of idioms.

**Progress:** 0 of 908 reviewed.

The consent text and protocol card are long-form documents under `src/lib/i18n/consent/` and are reviewed as whole documents (Phase 2).

| Key | English | Kiswahili (draft) | reviewed | reviewer |
|---|---|---|---|---|
| `app.name` | Virtual Tailor | Virtual Tailor | false |  |
| `app.shortName` | VT | VT | false |  |
| `app.tagline` | Get your tailoring measurements with your phone. | Pata vipimo vyako vya ushonaji kwa simu yako. | false |  |
| `app.privacyLine` | Photos stay on this phone. Only your measurements go to your tailor. | Picha zinabaki kwenye simu hii. Vipimo vyako tu ndivyo vinavyokwenda kwa fundi wako. | false |  |
| `lang.label` | Language | Lugha | false |  |
| `lang.en` | English | English | false |  |
| `lang.sw` | Kiswahili | Kiswahili | false |  |
| `lang.enShort` | EN | EN | false |  |
| `lang.swShort` | SW | SW | false |  |
| `common.back` | Back | Rudi | false |  |
| `common.continue` | Continue | Endelea | false |  |
| `common.cancel` | Cancel | Ghairi | false |  |
| `common.close` | Close | Funga | false |  |
| `common.save` | Save | Hifadhi | false |  |
| `common.retry` | Try again | Jaribu tena | false |  |
| `common.loading` | Loading… | Inapakia… | false |  |
| `common.menu` | Menu | Menyu | false |  |
| `common.skipToContent` | Skip to main content | Ruka hadi maudhui | false |  |
| `common.goHome` | Go to the start | Nenda mwanzo | false |  |
| `common.yes` | Yes | Ndiyo | false |  |
| `common.no` | No | Hapana | false |  |
| `common.days` | {count, plural, one {# day} other {# days}} | {count, plural, one {siku #} other {siku #}} | false |  |
| `banner.offline` | You are offline. You can still measure; we will send when you are back online. | Huna mtandao. Bado unaweza kupima; tutatuma ukirudi mtandaoni. | false |  |
| `banner.unreviewedSw` | Development build: Kiswahili text has not been reviewed yet. | Toleo la majaribio: maandishi ya Kiswahili bado hayajakaguliwa. | false |  |
| `toast.updateReady` | A new version is ready | Toleo jipya liko tayari | false |  |
| `toast.refresh` | Refresh | Onyesha upya | false |  |
| `error.notFound.title` | Page not found | Ukurasa haupatikani | false |  |
| `error.notFound.body` | We could not find this page. | Hatukuweza kupata ukurasa huu. | false |  |
| `error.forbidden.title` | Not allowed | Hairuhusiwi | false |  |
| `error.forbidden.body` | Your account cannot open this page. | Akaunti yako haiwezi kufungua ukurasa huu. | false |  |
| `error.generic.title` | Something went wrong | Kuna tatizo | false |  |
| `error.generic.body` | Please try again. If it keeps happening, contact your tailor. | Tafadhali jaribu tena. Likiendelea, wasiliana na fundi wako. | false |  |
| `welcome.title` | Welcome | Karibu | false |  |
| `welcome.chooseLanguage` | Choose your language | Chagua lugha yako | false |  |
| `common.optional` | optional | si lazima | false |  |
| `common.required` | required | lazima | false |  |
| `common.edit` | Edit | Hariri | false |  |
| `common.delete` | Delete | Futa | false |  |
| `common.confirm` | Confirm | Thibitisha | false |  |
| `common.done` | Done | Imekamilika | false |  |
| `common.next` | Next | Endelea | false |  |
| `common.previous` | Previous | Iliyotangulia | false |  |
| `common.loadMore` | Load more | Pakia zaidi | false |  |
| `common.show` | Show | Onyesha | false |  |
| `common.hide` | Hide | Ficha | false |  |
| `common.search` | Search | Tafuta | false |  |
| `common.mute` | Mute | Zima sauti | false |  |
| `common.unmute` | Sound on | Washa sauti | false |  |
| `common.copy` | Copy | Nakili | false |  |
| `common.copied` | Copied | Imenakiliwa | false |  |
| `common.help` | Help | Msaada | false |  |
| `common.lastUpdated` | Last updated {time} | Ilisasishwa mara ya mwisho {time} | false |  |
| `common.of` | {current} of {total} | {current} kati ya {total} | false |  |
| `validate.code` | Enter the 6-character code from your tailor, for example AB1234 | Weka nambari ya herufi 6 kutoka kwa fundi wako, kwa mfano AB1234 | false |  |
| `validate.height` | Height must be between 120 and 220 cm | Urefu lazima uwe kati ya sentimita 120 na 220 | false |  |
| `validate.ease` | Ease must be between 0 and 30 cm | Nafasi ya ziada lazima iwe kati ya sentimita 0 na 30 | false |  |
| `validate.duePast` | Due date cannot be in the past | Tarehe ya kukamilisha haiwezi kuwa iliyopita | false |  |
| `validate.dueFar` | Due date must be within 180 days | Tarehe ya kukamilisha lazima iwe ndani ya siku 180 | false |  |
| `validate.dueRequired` | Choose a due date | Chagua tarehe ya kukamilisha | false |  |
| `validate.email` | Enter an email address like name@example.com | Weka barua pepe kama jina@mfano.com | false |  |
| `validate.passwordShort` | Use at least 10 characters | Tumia angalau herufi 10 | false |  |
| `validate.passwordCommon` | This password is too common. Choose another. | Nenosiri hili ni la kawaida mno. Chagua jingine. | false |  |
| `validate.phone` | Enter a Kenyan mobile number, for example 0712 345 678 | Weka nambari ya simu ya Kenya, kwa mfano 0712 345 678 | false |  |
| `validate.required` | This is required | Hii ni lazima | false |  |
| `validate.number` | Enter a number | Weka nambari | false |  |
| `validate.range` | Enter a value from {min} to {max} | Weka thamani kuanzia {min} hadi {max} | false |  |
| `validate.date` | Enter a valid date | Weka tarehe sahihi | false |  |
| `flag.pass` | Good | Sawa | false |  |
| `flag.check` | Check | Kagua | false |  |
| `flag.fail` | Not measured | Haijapimwa | false |  |
| `flagReason.scale_disagree` | The two ways of measuring scale differed by {pct}%. | Njia mbili za kupima ukubwa zilitofautiana kwa {pct}%. | false |  |
| `flagReason.level_unchecked` | We could not check that the phone was straight. | Hatukuweza kuhakikisha kuwa simu ilikuwa imenyooka. | false |  |
| `flagReason.loose_clothing` | Loose clothes can make this too big. | Nguo pana zinaweza kufanya kipimo hiki kiwe kikubwa mno. | false |  |
| `flagReason.landmark_low` | We could not see this part of the body clearly. | Hatukuona sehemu hii ya mwili vizuri. | false |  |
| `flagReason.mask_gap` | Part of your outline was missing here. | Sehemu ya umbo lako ilikosekana hapa. | false |  |
| `flagReason.out_of_range` | The value was outside the usual range. | Kipimo kilikuwa nje ya kiwango cha kawaida. | false |  |
| `flagReason.crotch_not_found` | We could not find the gap between your legs. Stand with feet a little apart. | Hatukupata nafasi kati ya miguu yako. Simama ukiachanisha miguu kidogo. | false |  |
| `flagReason.marker_weak` | The measuring sheet was hard to see. | Karatasi ya kupimia ilikuwa vigumu kuonekana. | false |  |
| `flagReason.waist_level_mismatch` | Your waist line was hard to find. | Mstari wa kiuno chako ulikuwa vigumu kupata. | false |  |
| `flagReason.view_failed` | This view could not be used. | Picha hii haikuweza kutumika. | false |  |
| `sync.pending` | Waiting to send | Inasubiri kutuma | false |  |
| `sync.synced` | Sent | Imetumwa | false |  |
| `sync.conflict` | Newer version on phone | Toleo jipya liko kwenye simu | false |  |
| `sync.rejected` | Code not found | Nambari haikupatikana | false |  |
| `site.stature` | Height | Urefu | false |  |
| `site.shoulder` | Shoulder width | Upana wa mabega | false |  |
| `site.chest` | Chest | Kifua | false |  |
| `site.bust` | Bust | Kifua | false |  |
| `site.waist` | Waist | Kiuno | false |  |
| `site.hip` | Hip | Nyonga | false |  |
| `site.sleeve` | Sleeve length | Urefu wa mkono | false |  |
| `site.outleg` | Outside leg | Urefu wa mguu (nje) | false |  |
| `site.inleg` | Inside leg | Urefu wa mguu (ndani) | false |  |
| `site.neck` | Neck | Shingo | false |  |
| `steps.label` | Progress | Maendeleo | false |  |
| `steps.details` | Details | Maelezo | false |  |
| `steps.consent` | Consent | Idhini | false |  |
| `steps.setup` | Setup | Maandalizi | false |  |
| `steps.front` | Front | Mbele | false |  |
| `steps.side` | Side | Upande | false |  |
| `steps.review` | Review | Kagua | false |  |
| `steps.current` | Step {n} of {total}: {name} | Hatua {n} kati ya {total}: {name} | false |  |
| `status.new` | New | Mpya | false |  |
| `status.cutting` | Cutting | Kukata | false |  |
| `status.fitting` | Fitting | Kupima nguo | false |  |
| `status.ready` | Ready | Tayari | false |  |
| `status.collected` | Collected | Imechukuliwa | false |  |
| `garment.shirt` | Shirt | Shati | false |  |
| `garment.dress` | Dress | Gauni | false |  |
| `garment.trousers` | Trousers | Suruali | false |  |
| `garment.suit_jacket` | Suit jacket | Koti la suti | false |  |
| `garment.skirt` | Skirt | Sketi | false |  |
| `garment.other` | Other | Nyingine | false |  |
| `check.level` | Level | Imenyooka | false |  |
| `check.frame` | Whole body in frame | Mwili mzima unaonekana | false |  |
| `check.distance` | Distance | Umbali | false |  |
| `check.symmetry` | Facing camera | Unatazama kamera | false |  |
| `check.arms` | Arms away | Mikono mbali | false |  |
| `check.marker` | Sheet found | Karatasi imeonekana | false |  |
| `check.light` | Light and sharp | Mwanga na uwazi | false |  |
| `check.state.pass` | OK | Sawa | false |  |
| `check.state.fail` | Fix | Rekebisha | false |  |
| `check.state.pending` | Waiting | Inasubiri | false |  |
| `check.listLabel` | Capture checks | Ukaguzi wa picha | false |  |
| `level.label` | Phone level | Usawa wa simu | false |  |
| `level.ok` | Level | Imenyooka | false |  |
| `level.tilted` | Tilted | Imeinama | false |  |
| `level.unknown` | Cannot check | Haiwezi kukagua | false |  |
| `countdown.label` | Taking photos in {n} | Kupiga picha baada ya {n} | false |  |
| `unit.cm` | cm | sm | false |  |
| `unit.in` | in | in | false |  |
| `audit.action.login` | Signed in | Aliingia | false |  |
| `audit.action.profile_view` | Viewed profile | Aliangalia vipimo | false |  |
| `audit.action.export` | Exported | Alipakua | false |  |
| `audit.action.share` | Shared | Alishiriki | false |  |
| `audit.action.override` | Overrode a value | Alibadilisha kipimo | false |  |
| `audit.action.deletion` | Deleted | Alifuta | false |  |
| `audit.action.status_change` | Changed status | Alibadilisha hali | false |  |
| `audit.action.code_issue` | Issued a code | Alitoa nambari | false |  |
| `audit.action.approve` | Approved | Aliidhinisha | false |  |
| `audit.action.settings_change` | Changed settings | Alibadilisha mipangilio | false |  |
| `empty.title` | Nothing here yet | Hakuna kitu bado | false |  |
| `error.load` | We could not load this. | Hatukuweza kupakia hii. | false |  |
| `error.offline` | You are offline. Connect to the internet and try again. | Huna mtandao. Unganisha intaneti kisha jaribu tena. | false |  |
| `code.label` | Client code (from your tailor) | Nambari ya mteja (kutoka kwa fundi wako) | false |  |
| `code.hint` | 6 characters, for example AB1234 | Herufi 6, kwa mfano AB1234 | false |  |
| `code.charLabel` | Character {n} of 6 | Herufi {n} kati ya 6 | false |  |
| `password.show` | Show password | Onyesha nenosiri | false |  |
| `password.hide` | Hide password | Ficha nenosiri | false |  |
| `password.strength` | Password strength: {level} | Nguvu ya nenosiri: {level} | false |  |
| `password.strength.0` | none | hakuna | false |  |
| `password.strength.1` | too weak | dhaifu mno | false |  |
| `password.strength.2` | fair | wastani | false |  |
| `password.strength.3` | good | nzuri | false |  |
| `password.strength.4` | strong | imara | false |  |
| `qr.label` | QR code for {text} | Msimbo wa QR wa {text} | false |  |
| `table.noRows` | No rows | Hakuna safu | false |  |
| `dev.ui.title` | Component gallery | Maonyesho ya vipengele | false |  |
| `dev.mock.title` | Mock backend controls | Vidhibiti vya seva ya majaribio | false |  |
| `client.menu.label` | More options | Chaguo zaidi | false |  |
| `client.menu.me` | My measurements | Vipimo vyangu | false |  |
| `client.menu.help` | Help | Msaada | false |  |
| `client.menu.privacy` | Privacy | Faragha | false |  |
| `client.welcome.promise` | Get your tailoring measurements with your phone. Your photos never leave this phone. | Pata vipimo vyako vya ushonaji kwa simu yako. Picha zako haziondoki kwenye simu hii. | false |  |
| `client.welcome.haveSaved` | I already have measurements saved | Tayari nina vipimo vilivyohifadhiwa | false |  |
| `client.welcome.how` | How it works | Jinsi inavyofanya kazi | false |  |
| `client.welcome.codeReady` | Your code {code} is ready. | Nambari yako {code} iko tayari. | false |  |
| `start.title` | Your details | Maelezo yako | false |  |
| `start.code.from` | Code from: {name} | Nambari kutoka: {name} | false |  |
| `start.code.offline` | We will check this code when you are online. | Tutakagua nambari hii ukiwa mtandaoni. | false |  |
| `start.code.checking` | Checking the code… | Tunakagua nambari… | false |  |
| `start.height.label` | Height | Urefu | false |  |
| `start.height.hint` | Ask your tailor to measure it, or measure against a wall without shoes. | Mwombe fundi wako akupime, au jipime ukutani bila viatu. | false |  |
| `start.height.byTailor` | Measured by your tailor | Imepimwa na fundi wako | false |  |
| `start.height.feet` | Did you mean {ft} ft {inch} in? That is {cm} cm. | Ulimaanisha futi {ft} inchi {inch}? Hiyo ni sentimita {cm}. | false |  |
| `start.height.useCm` | Use {cm} cm | Tumia sentimita {cm} | false |  |
| `start.sex.legend` | Sex | Jinsia | false |  |
| `start.sex.hint` | Used only to pick the right chest measuring rule. | Inatumika tu kuchagua kanuni sahihi ya kupima kifua. | false |  |
| `start.sex.female` | Female | Mwanamke | false |  |
| `start.sex.male` | Male | Mwanamume | false |  |
| `start.sex.unspecified` | Prefer not to say | Sipendi kusema | false |  |
| `start.fit.legend` | What are you wearing? | Umevaa nini? | false |  |
| `start.fit.fitted` | Fitted | Nguo zinazobana | false |  |
| `start.fit.fittedDesc` | T-shirt, leggings or fitted trousers | Fulana, leggings au suruali inayobana | false |  |
| `start.fit.loose` | Loose | Nguo pana | false |  |
| `start.fit.looseDesc` | Wide or baggy clothes | Nguo pana au zinazopwaya | false |  |
| `start.fit.looseWarn` | Loose clothes make measurements too big. Please change into fitted clothes if you can. | Nguo pana hufanya vipimo kuwa vikubwa mno. Tafadhali vaa nguo zinazobana ukiweza. | false |  |
| `start.next` | You will be asked for consent next. | Hatua inayofuata ni kutoa idhini. | false |  |
| `consent.title` | Before we start | Kabla hatujaanza | false |  |
| `consent.readFull` | Read full text | Soma maandishi yote | false |  |
| `consent.box1` | I agree to be measured from my photos. | Nakubali kupimwa kutoka kwenye picha zangu. | false |  |
| `consent.box2` | I understand only measurements, not photos, go to my tailor. | Naelewa kuwa vipimo tu, si picha, ndivyo vinavyokwenda kwa fundi wangu. | false |  |
| `consent.box3` | I agree that my tailor keeps my measurements until I ask for them to be deleted. | Nakubali fundi wangu ahifadhi vipimo vyangu hadi nitakapoomba vifutwe. | false |  |
| `consent.version` | Consent text version {version}, {language} | Toleo la maandishi ya idhini {version}, {language} | false |  |
| `consent.helper` | Tick all three boxes to continue. | Weka tiki kwenye visanduku vyote vitatu ili kuendelea. | false |  |
| `consent.openCamera` | Open camera | Fungua kamera | false |  |
| `consent.decline` | I do not agree | Sikubali | false |  |
| `declined.title` | You chose not to continue | Umechagua kutoendelea | false |  |
| `declined.body` | That is fine. Nothing has been saved or sent. | Hakuna shida. Hakuna kilichohifadhiwa wala kutumwa. | false |  |
| `declined.alt` | Your tailor can measure you in person with a tape. | Fundi wako anaweza kukupima ana kwa ana kwa utepe. | false |  |
| `declined.clear` | Clear the details I entered | Futa maelezo niliyoweka | false |  |
| `declined.cleared` | Your details have been cleared from this phone. | Maelezo yako yamefutwa kwenye simu hii. | false |  |
| `declined.back` | Go back to consent | Rudi kwenye idhini | false |  |
| `check.title` | Phone check | Ukaguzi wa simu | false |  |
| `check.running` | Checking your phone… | Tunakagua simu yako… | false |  |
| `check.verdict.ready` | Ready | Iko tayari | false |  |
| `check.verdict.slower` | Ready, but slower | Iko tayari, lakini itakuwa polepole | false |  |
| `check.verdict.cannot` | This phone cannot measure | Simu hii haiwezi kupima | false |  |
| `check.verdictBody.ready` | This phone can measure you. | Simu hii inaweza kukupima. | false |  |
| `check.verdictBody.slower` | This phone can measure you, but it may be slow. Read the notes below. | Simu hii inaweza kukupima, lakini huenda ikawa polepole. Soma maelezo hapa chini. | false |  |
| `check.verdictBody.cannot` | You can still be measured. Choose one of the options below. | Bado unaweza kupimwa. Chagua mojawapo ya njia zilizo hapa chini. | false |  |
| `check.row.secure` | Secure connection | Muunganisho salama | false |  |
| `check.row.browser` | Browser | Kivinjari | false |  |
| `check.row.simd` | Browser speed | Kasi ya kivinjari | false |  |
| `check.row.memory` | Memory | Kumbukumbu | false |  |
| `check.row.camera` | Back camera | Kamera ya nyuma | false |  |
| `check.row.resolution` | Camera picture size | Ukubwa wa picha ya kamera | false |  |
| `check.row.motion` | Motion sensors | Vihisi vya mwendo | false |  |
| `check.row.storage` | Storage space | Nafasi ya kuhifadhi | false |  |
| `check.row.models` | Measuring files | Faili za kupimia | false |  |
| `check.msg.secure` | Open Virtual Tailor from the link your tailor sent. | Fungua Virtual Tailor kutoka kwenye kiungo alichotuma fundi wako. | false |  |
| `check.msg.browser` | Please update Chrome (or Safari) and try again. | Tafadhali sasisha Chrome (au Safari) kisha ujaribu tena. | false |  |
| `check.msg.simd` | This browser is too old to measure. Update it or use another phone. | Kivinjari hiki ni cha zamani mno kupima. Kisasishe au tumia simu nyingine. | false |  |
| `check.msg.memory` | This phone has little memory. Close other apps before measuring. | Simu hii ina kumbukumbu ndogo. Funga programu nyingine kabla ya kupima. | false |  |
| `check.msg.camera` | We need the back camera. | Tunahitaji kamera ya nyuma. | false |  |
| `check.msg.resolution` | This camera's picture is too small for accurate measuring. | Picha ya kamera hii ni ndogo mno kwa kupima kwa usahihi. | false |  |
| `check.msg.motion` | We cannot check that the phone is straight. Prop it carefully against something upright. | Hatuwezi kukagua kama simu imenyooka. Iegemeze kwa uangalifu kwenye kitu kilichosimama wima. | false |  |
| `check.msg.storage` | Your phone is nearly full. | Simu yako karibu imejaa. | false |  |
| `check.msg.modelsCached` | Downloaded | Imepakuliwa | false |  |
| `check.msg.modelsDownload` | Will download about {mb} MB | Itapakua takriban MB {mb} | false |  |
| `check.msg.simulated` | Simulated camera (development) | Kamera ya majaribio (maendeleo) | false |  |
| `check.msg.cameraLater` | Checked when you allow the camera | Itakaguliwa ukiruhusu kamera | false |  |
| `check.status.pass` | OK | Sawa | false |  |
| `check.status.caution` | Warning | Tahadhari | false |  |
| `check.status.fail` | Problem | Tatizo | false |  |
| `check.status.skip` | Not checked | Haijakaguliwa | false |  |
| `check.status.pending` | Later | Baadaye | false |  |
| `check.inPerson` | Ask your tailor to measure you in person | Mwombe fundi wako akupime ana kwa ana | false |  |
| `check.inPersonBody` | Show your tailor this code: {code}. They can measure you with a tape. | Mwonyeshe fundi wako nambari hii: {code}. Anaweza kukupima kwa utepe. | false |  |
| `check.otherPhone` | Try another phone | Jaribu simu nyingine | false |  |
| `check.otherPhoneBody` | Open this link on another phone, or scan the code: | Fungua kiungo hiki kwenye simu nyingine, au skani msimbo: | false |  |
| `sheet.title` | Get the measuring sheet | Pata karatasi ya kupimia | false |  |
| `sheet.intro` | You hold this sheet while the phone takes your photos. It helps the phone measure in centimetres. | Utashika karatasi hii simu ikipiga picha zako. Inasaidia simu kupima kwa sentimita. | false |  |
| `sheet.have` | My tailor gave me a sheet | Fundi wangu alinipa karatasi | false |  |
| `sheet.print` | Print it | Ichapishe | false |  |
| `sheet.printHint` | Print at 100% / Actual size, not 'Fit to page'. A cyber café can print it. | Chapisha kwa 100% / Ukubwa halisi, si 'Fit to page'. Cyber café inaweza kuichapisha. | false |  |
| `sheet.download` | Download the sheet (PDF) | Pakua karatasi (PDF) | false |  |
| `sheet.preview` | Show me what it looks like | Nionyeshe inavyoonekana | false |  |
| `sheet.previewAlt` | The measuring sheet: a black square with a white border, a 10 cm line and a bank card box. | Karatasi ya kupimia: mraba mweusi wenye mpaka mweupe, mstari wa sentimita 10 na kisanduku cha kadi ya benki. | false |  |
| `sheet.check.title` | Check your sheet | Kagua karatasi yako | false |  |
| `sheet.check.line` | Check the line on your sheet with a ruler or tape. Is it exactly 10 cm? | Pima mstari kwenye karatasi yako kwa rula au utepe. Je, ni sentimita 10 kamili? | false |  |
| `sheet.check.card` | Or: does a bank card fit exactly in the box? | Au: je, kadi ya benki inatosha sawasawa kwenye kisanduku? | false |  |
| `sheet.check.yes` | Yes, it is right | Ndiyo, iko sawa | false |  |
| `sheet.check.no` | No | Hapana | false |  |
| `sheet.check.bad` | Your sheet printed at the wrong size. Print again at 100% or ask your tailor for one. | Karatasi yako ilichapishwa kwa ukubwa usio sahihi. Chapisha tena kwa 100% au mwombe fundi wako akupe moja. | false |  |
| `sheet.check.ok` | Good. Your sheet is the right size. | Vizuri. Karatasi yako ina ukubwa sahihi. | false |  |
| `sheet.tips.title` | Tips | Vidokezo | false |  |
| `sheet.tip1` | Keep it flat. Glue it to cardboard if you can. | Iweke sawasawa. Ibandike kwenye kadibodi ukiweza. | false |  |
| `sheet.tip2` | Do not fold through the black square. | Usikunje katikati ya mraba mweusi. | false |  |
| `sheet.tip3` | Do not cover the black square with your fingers. | Usifunike mraba mweusi kwa vidole vyako. | false |  |
| `setup.title` | Set up your phone | Andaa simu yako | false |  |
| `setup.stepOf` | Step {n} of {total} | Hatua {n} kati ya {total} | false |  |
| `setup.dl.title` | Download (first time only) | Pakua (mara ya kwanza tu) | false |  |
| `setup.dl.body` | Virtual Tailor needs to download about {mb} MB once. Use Wi-Fi if you can. | Virtual Tailor inahitaji kupakua takriban MB {mb} mara moja. Tumia Wi-Fi ukiweza. | false |  |
| `setup.dl.now` | Download now | Pakua sasa | false |  |
| `setup.dl.later` | Later | Baadaye | false |  |
| `setup.dl.progress` | {mb} of {total} MB · {pct}% | MB {mb} kati ya {total} · {pct}% | false |  |
| `setup.dl.failed` | Connect to the internet once to finish setting up. | Unganisha intaneti mara moja ili kumaliza maandalizi. | false |  |
| `setup.dl.done` | Done. You can now measure without internet. | Imekamilika. Sasa unaweza kupima bila intaneti. | false |  |
| `setup.dl.simulated` | Nothing to download in simulation mode. | Hakuna cha kupakua katika hali ya majaribio. | false |  |
| `setup.dl.laterNote` | You need to download the files before measuring. | Unahitaji kupakua faili kabla ya kupima. | false |  |
| `setup.who.legend` | Who is taking the photos? | Nani anapiga picha? | false |  |
| `setup.who.self` | I am alone | Niko peke yangu | false |  |
| `setup.who.selfDesc` | The phone will count down and take the photos itself | Simu itahesabu na kupiga picha yenyewe | false |  |
| `setup.who.assisted` | Someone is helping me | Kuna mtu ananisaidia | false |  |
| `setup.who.assistedDesc` | They will press the button | Atabonyeza kitufe | false |  |
| `setup.cam.title` | Allow the camera | Ruhusu kamera | false |  |
| `setup.cam.body` | Virtual Tailor needs the camera to see you. Photos stay on this phone. | Virtual Tailor inahitaji kamera ili ikuone. Picha zinabaki kwenye simu hii. | false |  |
| `setup.cam.allow` | Allow camera | Ruhusu kamera | false |  |
| `setup.cam.allowed` | Camera allowed | Kamera imeruhusiwa | false |  |
| `setup.cam.denied` | The camera is blocked. Turn it on like this: | Kamera imezuiwa. Iwashe hivi: | false |  |
| `setup.cam.recover.chrome` | Chrome: tap the lock icon next to the address › Permissions › Camera › Allow. | Chrome: gusa alama ya kufuli karibu na anwani › Ruhusa › Kamera › Ruhusu. | false |  |
| `setup.cam.recover.safari` | Safari: tap aA in the address bar › Website Settings › Camera › Allow. | Safari: gusa aA kwenye upau wa anwani › Mipangilio ya Tovuti › Kamera › Ruhusu. | false |  |
| `setup.cam.recover.samsung` | Samsung Internet: tap the lock icon › Permissions › Camera › Allow. | Samsung Internet: gusa alama ya kufuli › Ruhusa › Kamera › Ruhusu. | false |  |
| `setup.cam.unavailable` | The camera could not start. | Kamera imeshindwa kuanza. | false |  |
| `setup.cam.fallback` | Use the camera app instead (helper needed) | Tumia programu ya kamera badala yake (anahitajika msaidizi) | false |  |
| `setup.motion.title` | Allow motion | Ruhusu mwendo | false |  |
| `setup.motion.body` | This lets Virtual Tailor check that the phone is straight. | Hii inaruhusu Virtual Tailor kukagua kama simu imenyooka. | false |  |
| `setup.motion.allow` | Allow motion | Ruhusu mwendo | false |  |
| `setup.motion.denied` | Motion is off. We will skip the level check and mark your measurements to be checked. | Mwendo umezimwa. Tutaruka ukaguzi wa usawa na kuweka alama vipimo vyako vikaguliwe. | false |  |
| `setup.place.title` | Place the phone | Weka simu | false |  |
| `setup.place.body` | Stand the phone upright on a chair seat, leaning on the backrest. The back camera faces a plain wall about three big steps away, at belly-button height. | Simamisha simu wima juu ya kiti, ikiegemea mgongo wa kiti. Kamera ya nyuma itazame ukuta mtupu hatua tatu kubwa hivi, kwenye kimo cha kitovu. | false |  |
| `setup.place.level` | Lean the phone until the bubble is in the middle and the tick turns green. | Inamisha simu hadi kiputo kiwe katikati na alama ya tiki iwe kijani. | false |  |
| `setup.place.noLevel` | We cannot read the phone angle. Prop it upright carefully. | Hatuwezi kusoma pembe ya simu. Isimamishe wima kwa uangalifu. | false |  |
| `setup.start` | I'm ready — start | Niko tayari — anza | false |  |
| `setup.say.walk` | Go and stand against the wall. Face the phone. | Nenda usimame karibu na ukuta. Tazama simu. | false |  |
| `capture.front.title` | Front view · 1 of 2 | Picha ya mbele · 1 kati ya 2 | false |  |
| `capture.side.title` | Side view · 2 of 2 | Picha ya upande · 2 kati ya 2 | false |  |
| `capture.close` | Stop measuring | Acha kupima | false |  |
| `capture.stopTitle` | Stop measuring? | Uache kupima? | false |  |
| `capture.stopBody` | Nothing has been saved. | Hakuna kilichohifadhiwa. | false |  |
| `capture.stopYes` | Stop | Acha | false |  |
| `capture.keepGoing` | Keep going | Endelea | false |  |
| `capture.walk` | Walk to the wall… {n} | Nenda ukutani… {n} | false |  |
| `capture.turn` | Turn to your right so your right shoulder faces the phone. Hold the sheet flat on your right hip. Let your arms hang a little forward. | Geuka kulia ili bega lako la kulia litazame simu. Shika karatasi sawasawa kwenye nyonga ya kulia. Acha mikono ining'inie mbele kidogo. | false |  |
| `capture.turnShort` | Turn to your right | Geuka kulia | false |  |
| `capture.sheetHere` | Sheet here | Karatasi hapa | false |  |
| `capture.shutter` | Take photos | Piga picha | false |  |
| `capture.auto` | Will take photos when all checks are green | Itapiga picha ukaguzi wote ukiwa kijani | false |  |
| `capture.holdStill` | Hold still… | Tulia… | false |  |
| `capture.done` | Done | Imekamilika | false |  |
| `capture.allGood` | All good — hold still | Kila kitu sawa — tulia | false |  |
| `capture.footer` | Photos stay on this phone. Nothing is uploaded. | Picha zinabaki kwenye simu hii. Hakuna kinachopakiwa. | false |  |
| `capture.flip` | Flip view | Badilisha picha | false |  |
| `capture.simulated` | Simulated camera | Kamera ya majaribio | false |  |
| `capture.tryAgain` | Please hold still and try again | Tafadhali tulia kisha ujaribu tena | false |  |
| `capture.cameraLost` | The camera stopped. Tap to start it again. | Kamera imesimama. Gusa ili kuianzisha tena. | false |  |
| `capture.restart` | Start camera | Anzisha kamera | false |  |
| `capture.msg.level` | Not level — straighten the phone | Haijanyooka — nyoosha simu | false |  |
| `capture.msg.stepInto` | Step into the outline | Ingia ndani ya umbo | false |  |
| `capture.msg.headCut` | Your head is cut off — step back | Kichwa chako hakionekani — rudi nyuma | false |  |
| `capture.msg.feetCut` | Your feet are cut off — step back | Miguu yako haionekani — rudi nyuma | false |  |
| `capture.msg.sideCut` | Move to the middle | Sogea katikati | false |  |
| `capture.msg.tooFar` | Too far — step forward one step | Uko mbali mno — sogea mbele hatua moja | false |  |
| `capture.msg.tooClose` | Too close — step back one step | Uko karibu mno — rudi nyuma hatua moja | false |  |
| `capture.msg.faceCamera` | Turn to face the phone | Geuka utazame simu | false |  |
| `capture.msg.turnRight` | Turn a little more to your right | Geuka kulia kidogo zaidi | false |  |
| `capture.msg.armsAway` | Move your arm away from your body | Weka mkono mbali na mwili | false |  |
| `capture.msg.armsForward` | Let your arms hang a little forward | Acha mikono ining'inie mbele kidogo | false |  |
| `capture.msg.sheetFlat` | Hold the sheet flat — black square facing the phone | Shika karatasi sawasawa — mraba mweusi utazame simu | false |  |
| `capture.msg.fingersOff` | Move your fingers off the black square | Ondoa vidole kwenye mraba mweusi | false |  |
| `capture.msg.stepCloserSheet` | Step a little closer | Sogea karibu kidogo | false |  |
| `capture.msg.tooDark` | Too dark — turn on a light or face a window | Giza mno — washa taa au tazama dirisha | false |  |
| `capture.msg.tooBright` | Too bright behind you — move away from the window | Mwanga mwingi nyuma yako — ondoka mbele ya dirisha | false |  |
| `capture.msg.holdStill` | Hold still | Tulia | false |  |
| `capture.say.level` | The phone is tilted. Please straighten it. | Simu imeinama. Tafadhali inyooshe. | false |  |
| `processing.title` | Working out your measurements on this phone… | Tunakokotoa vipimo vyako kwenye simu hii… | false |  |
| `processing.step1` | Reading your outline | Tunasoma umbo lako | false |  |
| `processing.step2` | Using the sheet to measure | Tunatumia karatasi kupima | false |  |
| `processing.step3` | Calculating | Tunakokotoa | false |  |
| `processing.elapsed` | {s} s | sekunde {s} | false |  |
| `processing.note` | Photos stay on this phone. | Picha zinabaki kwenye simu hii. | false |  |
| `processing.failed` | We could not read the {view} photo. Please take it again. | Hatukuweza kusoma picha ya {view}. Tafadhali ipige tena. | false |  |
| `processing.retry` | Take it again | Ipige tena | false |  |
| `view.front` | front | mbele | false |  |
| `view.side` | side | upande | false |  |
| `review.title` | Your measurements | Vipimo vyako | false |  |
| `review.listTitle` | All measurements | Vipimo vyote | false |  |
| `review.flagsTitle` | Things to check | Mambo ya kukagua | false |  |
| `review.height` | Height you entered: {entered} · Estimated from photos: {estimated} | Urefu ulioweka: {entered} · Uliokadiriwa kutoka picha: {estimated} | false |  |
| `review.retakeFront` | Retake front | Piga ya mbele tena | false |  |
| `review.retakeSide` | Retake side | Piga ya upande tena | false |  |
| `review.retakeWhy` | {site} comes from the {view} photo | {site} kinatoka kwenye picha ya {view} | false |  |
| `review.save` | Save and send to tailor | Hifadhi na utume kwa fundi | false |  |
| `review.discard` | Discard | Tupa | false |  |
| `review.discardTitle` | Delete these measurements from this phone? | Ufute vipimo hivi kwenye simu hii? | false |  |
| `review.discardBody` | They have not been sent. | Havijatumwa. | false |  |
| `review.footer` | Saved measurements stay on this phone until you have a connection. | Vipimo vilivyohifadhiwa vinabaki kwenye simu hii hadi upate mtandao. | false |  |
| `review.scaleBanner` | Please retake the {view} photo — the sheet and your height did not agree. | Tafadhali piga picha ya {view} tena — karatasi na urefu wako havikulingana. | false |  |
| `review.readonly` | Measurements cannot be changed here. Your tailor will confirm them. | Vipimo haviwezi kubadilishwa hapa. Fundi wako atavithibitisha. | false |  |
| `review.detail.what` | What it is | Ni nini | false |  |
| `review.detail.how` | How it was worked out | Kilivyokokotolewa | false |  |
| `review.detail.note` | Note | Maelezo | false |  |
| `review.detail.view` | Which photo | Picha ipi | false |  |
| `review.fromView.front` | Front photo | Picha ya mbele | false |  |
| `review.fromView.side` | Side photo | Picha ya upande | false |  |
| `review.fromView.both` | Front and side photos | Picha za mbele na upande | false |  |
| `review.what.neck` | Around the base of your neck. | Kuzunguka chini ya shingo yako. | false |  |
| `review.what.shoulder` | Across your back from one shoulder tip to the other. | Mgongoni kutoka ncha ya bega moja hadi nyingine. | false |  |
| `review.what.chest` | Around the fullest part of your chest. | Kuzunguka sehemu pana zaidi ya kifua chako. | false |  |
| `review.what.waist` | Around your natural waist, the narrow part above your belly button. | Kuzunguka kiuno chako, sehemu nyembamba juu ya kitovu. | false |  |
| `review.what.hip` | Around the widest part of your hips. | Kuzunguka sehemu pana zaidi ya nyonga zako. | false |  |
| `review.what.sleeve` | From your shoulder tip down to your wrist. | Kutoka ncha ya bega hadi kifundo cha mkono. | false |  |
| `review.what.outleg` | From your waist down the outside of your leg to the floor. | Kutoka kiuno chini upande wa nje wa mguu hadi sakafuni. | false |  |
| `review.what.inleg` | From between your legs down to the floor. | Kutoka katikati ya miguu hadi sakafuni. | false |  |
| `review.how.length` | We measured the distance on the photo and used the sheet to turn it into centimetres. | Tulipima umbali kwenye picha na kutumia karatasi kuubadilisha kuwa sentimita. | false |  |
| `review.how.girth` | We measured how wide you are from the front and how deep from the side, then worked out the distance around. | Tulipima upana wako kutoka mbele na kina kutoka upande, kisha tukakokotoa mzunguko. | false |  |
| `review.noFlags` | All measurements look good. | Vipimo vyote vinaonekana sawa. | false |  |
| `saved.title` | Saved | Imehifadhiwa | false |  |
| `saved.synced` | Saved and sent to your tailor | Imehifadhiwa na kutumwa kwa fundi wako | false |  |
| `saved.pending` | Saved on this phone. It will send by itself when you are online. | Imehifadhiwa kwenye simu hii. Itajituma yenyewe ukiwa mtandaoni. | false |  |
| `saved.rejected` | Your tailor's code could not be found. Check the code with your tailor. | Nambari ya fundi wako haikupatikana. Kagua nambari na fundi wako. | false |  |
| `saved.conflict` | Saved and sent. Your tailor will check which version to use. | Imehifadhiwa na kutumwa. Fundi wako atakagua toleo la kutumia. | false |  |
| `saved.invalid` | We could not send this — please contact your tailor. | Hatukuweza kutuma hii — tafadhali wasiliana na fundi wako. | false |  |
| `saved.sending` | Sending… | Inatuma… | false |  |
| `saved.changeCode` | Change code | Badilisha nambari | false |  |
| `saved.codeLine` | Your code: {code} · Measured {date} | Nambari yako: {code} · Ilipimwa {date} | false |  |
| `saved.next` | Your tailor will contact you. | Fundi wako atawasiliana nawe. | false |  |
| `saved.whatsapp` | Tell your tailor on WhatsApp | Mwambie fundi wako kwa WhatsApp | false |  |
| `saved.waText` | Hello, I have sent my Virtual Tailor measurements. My code is {code}. | Habari, nimetuma vipimo vyangu vya Virtual Tailor. Nambari yangu ni {code}. | false |  |
| `saved.shared` | Is this someone else's phone? | Je, hii ni simu ya mtu mwingine? | false |  |
| `saved.clear` | Clear my details from this phone | Futa maelezo yangu kwenye simu hii | false |  |
| `saved.clearWarn` | {count, plural, one {# measurement has not been sent yet. It will stay on this phone until it is sent.} other {# measurements have not been sent yet. They will stay on this phone until they are sent.}} | {count, plural, one {Kipimo # bado hakijatumwa. Kitabaki kwenye simu hii hadi kitumwe.} other {Vipimo # bado havijatumwa. Vitabaki kwenye simu hii hadi vitumwe.}} | false |  |
| `saved.cleared` | Your details were cleared from this phone. | Maelezo yako yamefutwa kwenye simu hii. | false |  |
| `saved.again` | Measure again | Pima tena | false |  |
| `saved.install` | Add Virtual Tailor to your home screen | Weka Virtual Tailor kwenye skrini ya mwanzo | false |  |
| `saved.installIos` | On iPhone: tap Share, then 'Add to Home Screen'. | Kwenye iPhone: gusa Shiriki, kisha 'Add to Home Screen'. | false |  |
| `saved.installBtn` | Add to home screen | Weka kwenye skrini ya mwanzo | false |  |
| `saved.newCode` | New code | Nambari mpya | false |  |
| `me.title` | My measurements | Vipimo vyangu | false |  |
| `me.empty` | No measurements saved on this phone. | Hakuna vipimo vilivyohifadhiwa kwenye simu hii. | false |  |
| `me.measureNow` | Measure now | Pima sasa | false |  |
| `me.version` | Version {v} | Toleo {v} | false |  |
| `me.summary` | {pass} good · {check} check · {fail} not measured | {pass} sawa · {check} kagua · {fail} haijapimwa | false |  |
| `me.delete` | Delete my data | Futa data yangu | false |  |
| `me.deleteBody` | We will delete these measurements from this phone and ask your tailor's system to delete them too. | Tutafuta vipimo hivi kwenye simu hii na kuomba mfumo wa fundi wako uvifute pia. | false |  |
| `me.confirmTitle` | Are you sure? | Una uhakika? | false |  |
| `me.confirmBody` | This cannot be undone. | Hii haiwezi kurudishwa. | false |  |
| `me.deleteYes` | Yes, delete | Ndiyo, futa | false |  |
| `me.deleteFinal` | Delete for good | Futa kabisa | false |  |
| `me.deleted` | Deleted from this phone. A deletion request will be sent to your tailor. | Imefutwa kwenye simu hii. Ombi la kufuta litatumwa kwa fundi wako. | false |  |
| `me.withdraw` | Withdraw consent | Ondoa idhini | false |  |
| `me.withdrawBody` | This deletes these measurements and tells your tailor that you withdraw your consent. | Hii inafuta vipimo hivi na kumwambia fundi wako kuwa umeondoa idhini yako. | false |  |
| `me.withdrawYes` | Yes, withdraw | Ndiyo, ondoa | false |  |
| `me.checks` | Capture checks | Ukaguzi wa picha | false |  |
| `me.scale` | Sheet and height differed by {pct}% | Karatasi na urefu vilitofautiana kwa {pct}% | false |  |
| `me.notFound` | This measurement is not on this phone. | Kipimo hiki hakipo kwenye simu hii. | false |  |
| `me.check.skipped` | Skipped | Imerukwa | false |  |
| `help.play` | Play instructions | Cheza maelekezo | false |  |
| `help.stop` | Stop | Simamisha | false |  |
| `privacy.title` | Privacy and your rights | Faragha na haki zako | false |  |
| `privacy.onPhone` | On this phone | Kwenye simu hii | false |  |
| `privacy.sent` | Sent to your tailor | Kinachotumwa kwa fundi wako | false |  |
| `privacy.unreviewed` | This Kiswahili text is a draft and has not yet been checked. | Maandishi haya ya Kiswahili ni rasimu na bado hayajakaguliwa. | false |  |
| `banner.storage` | Open Virtual Tailor once you are online so your measurements are sent. | Fungua Virtual Tailor ukiwa mtandaoni ili vipimo vyako vitumwe. | false |  |
| `banner.reminder` | Some measurements have not been sent yet. Connect to the internet to send them. | Baadhi ya vipimo bado havijatumwa. Unganisha intaneti ili kuvituma. | false |  |
| `fallback.title` | Take photos with the camera app | Piga picha kwa programu ya kamera | false |  |
| `fallback.body` | The live guide cannot run on this phone. The helper takes one photo from the front and one from the side, following the help card. The checks run after the photos are taken. | Mwongozo wa moja kwa moja hauwezi kufanya kazi kwenye simu hii. Msaidizi anapiga picha moja ya mbele na moja ya upande, akifuata kadi ya msaada. Ukaguzi unafanyika baada ya picha kupigwa. | false |  |
| `fallback.front` | Front photo | Picha ya mbele | false |  |
| `fallback.side` | Side photo | Picha ya upande | false |  |
| `fallback.take` | Take photo | Piga picha | false |  |
| `fallback.taken` | Photo ready | Picha iko tayari | false |  |
| `fallback.measure` | Work out measurements | Kokotoa vipimo | false |  |
| `dash.nav` | Main menu | Menyu kuu | false |  |
| `dash.account` | Account | Akaunti | false |  |
| `dash.settings` | Settings | Mipangilio | false |  |
| `dash.signOut` | Sign out | Ondoka | false |  |
| `dash.offline` | You are offline. You can look at what is already loaded; changes are off until you reconnect. | Huna mtandao. Unaweza kuangalia kilichopakiwa tayari; mabadiliko yamezimwa hadi uunganishe tena. | false |  |
| `dash.offlineDisabled` | Changes are off while you are offline. | Mabadiliko yamezimwa ukiwa nje ya mtandao. | false |  |
| `auth.email` | Email | Barua pepe | false |  |
| `auth.password` | Password | Nenosiri | false |  |
| `auth.login.title` | Sign in | Ingia | false |  |
| `auth.login.submit` | Sign in | Ingia | false |  |
| `auth.login.register` | Register as a tailor | Jisajili kama fundi | false |  |
| `auth.sessionEnded` | Your session ended. Please sign in again. | Muda wako umeisha. Tafadhali ingia tena. | false |  |
| `auth.error.invalid` | The email or password is not right. | Barua pepe au nenosiri si sahihi. | false |  |
| `auth.error.pending` | Your account is still waiting for approval. | Akaunti yako bado inasubiri kuidhinishwa. | false |  |
| `auth.error.disabled` | This account is switched off. Contact the Virtual Tailor administrator. | Akaunti hii imezimwa. Wasiliana na msimamizi wa Virtual Tailor. | false |  |
| `auth.error.rateLimited` | Too many tries. Please wait before trying again. | Majaribio mengi mno. Tafadhali subiri kabla ya kujaribu tena. | false |  |
| `auth.error.waitSeconds` | {count, plural, one {Wait # second.} other {Wait # seconds.}} | {count, plural, one {Subiri sekunde #.} other {Subiri sekunde #.}} | false |  |
| `auth.register.title` | Register as a tailor | Jisajili kama fundi | false |  |
| `auth.register.intro` | We check every new tailor account before it can be used. | Tunakagua kila akaunti mpya ya fundi kabla ya kutumika. | false |  |
| `auth.register.emailTaken` | This email cannot be used. Try another or sign in. | Barua pepe hii haiwezi kutumika. Jaribu nyingine au uingie. | false |  |
| `auth.register.passwordHint` | At least 10 characters. A short sentence is easy to remember. | Angalau herufi 10. Sentensi fupi ni rahisi kukumbuka. | false |  |
| `auth.register.business` | Business name | Jina la biashara | false |  |
| `auth.register.phone` | Phone | Simu | false |  |
| `auth.register.phoneHint` | Kenyan mobile number, for example 0712 345 678 | Nambari ya simu ya Kenya, kwa mfano 0712 345 678 | false |  |
| `auth.register.area` | Area | Eneo | false |  |
| `auth.register.areaHint` | For example Gikomba | Kwa mfano Gikomba | false |  |
| `auth.register.language` | Preferred language | Lugha unayopendelea | false |  |
| `auth.register.submit` | Register | Jisajili | false |  |
| `auth.register.haveAccount` | I already have an account | Tayari nina akaunti | false |  |
| `auth.pending.title` | Waiting for approval | Inasubiri kuidhinishwa | false |  |
| `auth.pending.body` | Your account is waiting for approval. We will let you know. | Akaunti yako inasubiri kuidhinishwa. Tutakujulisha. | false |  |
| `auth.pending.next` | After approval you can sign in and issue codes to your clients. | Baada ya kuidhinishwa unaweza kuingia na kuwapa wateja wako nambari. | false |  |
| `auth.pending.back` | Back to sign in | Rudi kwenye kuingia | false |  |
| `tailor.nav.clients` | Clients | Wateja | false |  |
| `tailor.nav.orders` | Orders | Oda | false |  |
| `tailor.nav.audit` | Audit | Kumbukumbu | false |  |
| `tailor.nav.settings` | Settings | Mipangilio | false |  |
| `tailor.flags.good` | {count} good | {count} sawa | false |  |
| `tailor.flags.check` | {count, plural, one {# check} other {# checks}} | {count, plural, one {# kagua} other {# kagua}} | false |  |
| `tailor.flags.fail` | {count} not measured | {count} hazijapimwa | false |  |
| `tailor.clients.title` | Clients | Wateja | false |  |
| `tailor.clients.searchHint` | Code or name | Nambari au jina | false |  |
| `tailor.clients.sort` | Sort by | Panga kwa | false |  |
| `tailor.clients.sortLast` | Last measured | Kipimo cha mwisho | false |  |
| `tailor.clients.sortCode` | Code | Nambari | false |  |
| `tailor.clients.sortName` | Name | Jina | false |  |
| `tailor.clients.filters` | Show only | Onyesha tu | false |  |
| `tailor.clients.filterNew` | Has new measurements | Ana vipimo vipya | false |  |
| `tailor.clients.filterFlags` | Has flags | Ana alama | false |  |
| `tailor.clients.filterNone` | No measurements yet | Bado hana vipimo | false |  |
| `tailor.clients.code` | Code | Nambari | false |  |
| `tailor.clients.name` | Name | Jina | false |  |
| `tailor.clients.lastCapture` | Last measured | Kipimo cha mwisho | false |  |
| `tailor.clients.sync` | Status | Hali | false |  |
| `tailor.clients.flags` | Flags | Alama | false |  |
| `tailor.clients.openOrders` | Open orders | Oda zilizo wazi | false |  |
| `tailor.clients.never` | Not yet | Bado | false |  |
| `tailor.clients.count` | {count, plural, one {# client} other {# clients}} | {count, plural, one {Mteja #} other {Wateja #}} | false |  |
| `tailor.clients.noMatch` | No clients match. | Hakuna mteja anayelingana. | false |  |
| `tailor.clients.emptyTitle` | No clients yet. | Bado huna wateja. | false |  |
| `tailor.clients.emptyBody` | Issue a code and send it to your client on WhatsApp. | Toa nambari na umtumie mteja wako kwa WhatsApp. | false |  |
| `tailor.clients.newCode` | New client code | Nambari mpya ya mteja | false |  |
| `tailor.issue.title` | Issue a client code | Toa nambari ya mteja | false |  |
| `tailor.issue.intro` | The client uses this code to send you their measurements. | Mteja atatumia nambari hii kukutumia vipimo vyake. | false |  |
| `tailor.issue.name` | Display name | Jina la kuonyesha | false |  |
| `tailor.issue.nameHint` | Only you see this. Leave empty to keep the client anonymous. | Ni wewe tu unayeliona. Acha wazi ili mteja abaki bila jina. | false |  |
| `tailor.issue.height` | Measured height | Urefu uliopimwa | false |  |
| `tailor.issue.heightHint` | Measure against a wall without shoes, if the client is here. | Pima ukutani bila viatu, kama mteja yupo hapa. | false |  |
| `tailor.issue.submit` | Issue code | Toa nambari | false |  |
| `tailor.issue.readyTitle` | Code ready | Nambari iko tayari | false |  |
| `tailor.issue.codeLabel` | Client code | Nambari ya mteja | false |  |
| `tailor.issue.qrLabel` | QR code to open Virtual Tailor with code {code} | Msimbo wa QR wa kufungua Virtual Tailor kwa nambari {code} | false |  |
| `tailor.issue.messageLang` | Message language | Lugha ya ujumbe | false |  |
| `tailor.issue.message` | Hello! Please measure yourself for your order with Virtual Tailor: {link}. Your code is {code}. You will need: fitted clothes, a measuring sheet (print it or collect from me), and a chair to stand your phone on. Your photos stay on your phone. | Habari! Tafadhali jipime kwa ajili ya oda yako kwa Virtual Tailor: {link}. Nambari yako ni {code}. Utahitaji: nguo zinazokubana, karatasi ya kupimia (ichapishe au uichukue kwangu), na kiti cha kusimamisha simu yako. Picha zako zinabaki kwenye simu yako. | false |  |
| `tailor.issue.whatsapp` | Send on WhatsApp | Tuma kwa WhatsApp | false |  |
| `tailor.issue.copy` | Copy link | Nakili kiungo | false |  |
| `tailor.issue.copyFailed` | Could not copy. Select the link and copy it. | Imeshindwa kunakili. Chagua kiungo kisha unakili. | false |  |
| `tailor.issue.print` | Print card | Chapisha kadi | false |  |
| `tailor.issue.openClient` | Open client | Fungua mteja | false |  |
| `tailor.issue.another` | Issue another code | Toa nambari nyingine | false |  |
| `tailor.client.title` | Client | Mteja | false |  |
| `tailor.client.displayName` | Display name | Jina la kuonyesha | false |  |
| `tailor.client.height` | Height | Urefu | false |  |
| `tailor.client.created` | Created | Iliundwa | false |  |
| `tailor.client.newerOnPhone` | Newer measurements on client's phone | Vipimo vipya viko kwenye simu ya mteja | false |  |
| `tailor.client.newOrderLatest` | New order from latest profile | Oda mpya kutoka vipimo vya karibuni | false |  |
| `tailor.client.rotate` | Issue new code | Toa nambari mpya | false |  |
| `tailor.client.rotateTitle` | Issue a new code? | Toa nambari mpya? | false |  |
| `tailor.client.rotateBody` | The old code {code} will stop working. Send the new code to your client. | Nambari ya zamani {code} itaacha kufanya kazi. Mtumie mteja wako nambari mpya. | false |  |
| `tailor.client.rotateConfirm` | Issue new code | Toa nambari mpya | false |  |
| `tailor.client.rotated` | New code {code} is ready. | Nambari mpya {code} iko tayari. | false |  |
| `tailor.client.delete` | Delete client data | Futa taarifa za mteja | false |  |
| `tailor.client.deleteTitle` | Delete this client's data? | Futa taarifa za mteja huyu? | false |  |
| `tailor.client.deleteBody` | This deletes the code, all measurements and collected orders for this client. It cannot be undone. | Hii inafuta nambari, vipimo vyote na oda zilizochukuliwa za mteja huyu. Haiwezi kurudishwa. | false |  |
| `tailor.client.deleteType` | Type the code {code} to confirm | Andika nambari {code} kuthibitisha | false |  |
| `tailor.client.deleteConfirm` | Delete | Futa | false |  |
| `tailor.client.deleteHasOrders` | This client has orders that are not collected yet. Close or collect those orders first. | Mteja huyu ana oda ambazo bado hazijachukuliwa. Funga au kabidhi oda hizo kwanza. | false |  |
| `tailor.client.goOrders` | Go to orders | Nenda kwenye oda | false |  |
| `tailor.client.deleted` | Client data deleted. | Taarifa za mteja zimefutwa. | false |  |
| `tailor.client.profiles` | Measurements | Vipimo | false |  |
| `tailor.client.noProfiles` | No measurements yet | Bado hakuna vipimo | false |  |
| `tailor.client.noProfilesBody` | When the client measures with the code, the measurements appear here. | Mteja akijipima kwa nambari hii, vipimo vitaonekana hapa. | false |  |
| `tailor.client.profileVersion` | Version {version} | Toleo {version} | false |  |
| `tailor.client.orders` | Orders | Oda | false |  |
| `tailor.client.noOrders` | No orders for this client yet. | Bado hakuna oda za mteja huyu. | false |  |
| `tailor.mode.self` | Self (alone) | Peke yake | false |  |
| `tailor.mode.assisted` | With a helper | Na msaidizi | false |  |
| `tailor.sheet.title` | Measurement sheet | Karatasi ya vipimo | false |  |
| `tailor.sheet.heading` | {code} · version {version} | {code} · toleo {version} | false |  |
| `tailor.sheet.model` | model {variant} | modeli {variant} | false |  |
| `tailor.sheet.rules` | rules {version} | kanuni {version} | false |  |
| `tailor.sheet.confirmAtFitting` | Some measurements are flagged. Confirm these at the fitting. | Baadhi ya vipimo vina alama. Vithibitishe wakati wa kujaribisha nguo. | false |  |
| `tailor.sheet.site` | Measurement | Kipimo | false |  |
| `tailor.sheet.value` | Value | Thamani | false |  |
| `tailor.sheet.flag` | Flag | Alama | false |  |
| `tailor.sheet.method` | Method | Njia | false |  |
| `tailor.sheet.methodAuto` | Auto | Otomatiki | false |  |
| `tailor.sheet.methodOverride` | Overridden | Imebadilishwa | false |  |
| `tailor.sheet.heightCheck` | Height entered: {entered} · Estimated from photos: {estimated} | Urefu ulioandikwa: {entered} · Uliokadiriwa kutoka picha: {estimated} | false |  |
| `tailor.sheet.diagram` | Diagram with numbered measurement places | Mchoro wenye nambari za sehemu za vipimo | false |  |
| `tailor.sheet.checks` | Capture checks | Ukaguzi wa picha | false |  |
| `tailor.sheet.check` | Check | Ukaguzi | false |  |
| `tailor.sheet.scaleDiff` | Scale difference: {pct}% | Tofauti ya ukubwa: {pct}% | false |  |
| `tailor.sheet.retakes` | {count, plural, =0 {No retakes} one {# retake} other {# retakes}} | {count, plural, =0 {Hakuna picha iliyorudiwa} one {Picha # ilirudiwa} other {Picha # zilirudiwa}} | false |  |
| `tailor.sheet.fitDeclared` | Clothing: {fit} | Nguo: {fit} | false |  |
| `tailor.sheet.newOrder` | New order from this profile | Oda mpya kutoka vipimo hivi | false |  |
| `tailor.sheet.print` | Print measurements | Chapisha vipimo | false |  |
| `tailor.check.pass` | Passed | Imepita | false |  |
| `tailor.check.fail` | Failed | Imeshindwa | false |  |
| `tailor.check.skipped` | Skipped | Imerukwa | false |  |
| `tailor.checkName.level` | Level | Usawa | false |  |
| `tailor.checkName.frame` | Whole body in frame | Mwili mzima kwenye picha | false |  |
| `tailor.checkName.marker` | Sheet found | Karatasi imeonekana | false |  |
| `tailor.checkName.symmetry` | Facing / profile | Kutazama / upande | false |  |
| `tailor.checkName.arms` | Arms | Mikono | false |  |
| `tailor.checkName.light` | Light | Mwanga | false |  |
| `tailor.fit.fitted` | fitted | zinazobana | false |  |
| `tailor.fit.loose` | loose | pana | false |  |
| `tailor.orders.title` | Orders | Oda | false |  |
| `tailor.orders.filter` | Filter by status | Chuja kwa hali | false |  |
| `tailor.orders.showCollected` | Show collected | Onyesha zilizochukuliwa | false |  |
| `tailor.orders.sort` | Sort by | Panga kwa | false |  |
| `tailor.orders.sortDue` | Due date | Tarehe ya kukamilisha | false |  |
| `tailor.orders.sortCreated` | Date created | Tarehe ya kuundwa | false |  |
| `tailor.orders.due` | Due {date} | Itakamilika {date} | false |  |
| `tailor.orders.overdue` | Overdue | Imechelewa | false |  |
| `tailor.orders.flagged` | {count, plural, one {# flagged site} other {# flagged sites}} | {count, plural, one {Kipimo # kina alama} other {Vipimo # vina alama}} | false |  |
| `tailor.orders.conflict` | Sync conflict: newer profile on phone | Mgongano: vipimo vipya viko kwenye simu | false |  |
| `tailor.orders.sheet` | Sheet | Karatasi | false |  |
| `tailor.orders.status` | Status | Hali | false |  |
| `tailor.orders.new` | New order | Oda mpya | false |  |
| `tailor.orders.emptyTitle` | No orders here. | Hakuna oda hapa. | false |  |
| `tailor.orders.emptyBody` | Create an order from a client's measurements. | Unda oda kutoka vipimo vya mteja. | false |  |
| `tailor.status.title` | Status of {no} | Hali ya {no} | false |  |
| `tailor.status.current` | Current status | Hali ya sasa | false |  |
| `tailor.status.backTitle` | Move the order back? | Rudisha oda nyuma? | false |  |
| `tailor.status.backBody` | This moves the order back from {from} to {to}. | Hii inarudisha oda kutoka {from} hadi {to}. | false |  |
| `tailor.status.backConfirm` | Move back | Rudisha | false |  |
| `tailor.status.changed` | {no} is now {status}. | {no} sasa ni {status}. | false |  |
| `tailor.order.title` | Order | Oda | false |  |
| `tailor.order.newTitle` | New order | Oda mpya | false |  |
| `tailor.order.pickClient` | Choose a client | Chagua mteja | false |  |
| `tailor.order.pickProfile` | Choose measurements for {code} | Chagua vipimo vya {code} | false |  |
| `tailor.order.otherClient` | Choose another client | Chagua mteja mwingine | false |  |
| `tailor.order.noClientsWithProfiles` | No clients with measurements match. | Hakuna mteja mwenye vipimo anayelingana. | false |  |
| `tailor.order.subline` | Client {client} · profile of {date}, v{version} | Mteja {client} · vipimo vya {date}, toleo {version} | false |  |
| `tailor.order.changeProfile` | Change profile | Badilisha vipimo | false |  |
| `tailor.order.garment` | Garment | Vazi | false |  |
| `tailor.order.due` | Due date | Tarehe ya kukamilisha | false |  |
| `tailor.order.dueHint` | Today or up to 180 days ahead | Leo au hadi siku 180 mbele | false |  |
| `tailor.order.showAll` | Show all measurements | Onyesha vipimo vyote | false |  |
| `tailor.order.applyPresets` | Apply my usual ease for {garment} | Tumia nafasi yangu ya kawaida kwa {garment} | false |  |
| `tailor.order.presetsApplied` | Your usual ease was applied. | Nafasi yako ya kawaida imewekwa. | false |  |
| `tailor.order.items` | Measurements | Vipimo | false |  |
| `tailor.order.body` | Body | Mwili | false |  |
| `tailor.order.ease` | Ease ({unit}) | Nafasi ({unit}) | false |  |
| `tailor.order.finished` | Finished | Kamili | false |  |
| `tailor.order.flaggedHelp` | Flagged: {reason} Confirm or override. | Ina alama: {reason} Thibitisha au badilisha. | false |  |
| `tailor.order.override` | Override | Badilisha | false |  |
| `tailor.order.undoOverride` | Use measured value | Tumia kipimo kilichopimwa | false |  |
| `tailor.order.overridden` | Overridden | Imebadilishwa | false |  |
| `tailor.order.confirmed` | Confirmed: {site} is right | Imethibitishwa: {site} ni sahihi | false |  |
| `tailor.order.measureAtFitting` | Will measure {site} at fitting | Nitapima {site} wakati wa kujaribisha | false |  |
| `tailor.order.atFitting` | At fitting | Wakati wa kujaribisha | false |  |
| `tailor.order.overrideTitle` | Override {site} | Badilisha {site} | false |  |
| `tailor.order.overrideValue` | New body value ({unit}) | Kipimo kipya cha mwili ({unit}) | false |  |
| `tailor.order.overrideReason` | Reason | Sababu | false |  |
| `tailor.order.overrideRecorded` | This change is recorded. | Mabadiliko haya yanarekodiwa. | false |  |
| `tailor.order.overrideSave` | Use this value | Tumia kipimo hiki | false |  |
| `tailor.order.notes` | Notes | Maelezo | false |  |
| `tailor.order.notesHint` | {count} of 1,000 characters. Extra measurements go here. | Herufi {count} kati ya 1,000. Vipimo vya ziada viandikwe hapa. | false |  |
| `tailor.order.notesPlaceholder` | Fabric, style, pockets… | Kitambaa, mtindo, mifuko… | false |  |
| `tailor.order.notesTooLong` | Notes can have at most 1,000 characters. | Maelezo yasizidi herufi 1,000. | false |  |
| `tailor.order.mustResolve` | {count, plural, one {Confirm or override # flagged measurement to save.} other {Confirm or override # flagged measurements to save.}} | {count, plural, one {Thibitisha au badilisha kipimo # chenye alama ili kuhifadhi.} other {Thibitisha au badilisha vipimo # vyenye alama ili kuhifadhi.}} | false |  |
| `tailor.order.save` | Save order | Hifadhi oda | false |  |
| `tailor.order.saved` | Order {no} saved | Oda {no} imehifadhiwa | false |  |
| `tailor.order.updated` | Order {no} updated | Oda {no} imesasishwa | false |  |
| `tailor.order.leaveTitle` | Leave without saving? | Ondoka bila kuhifadhi? | false |  |
| `tailor.order.leaveBody` | The order has not been saved. Your changes will be lost. | Oda haijahifadhiwa. Mabadiliko yako yatapotea. | false |  |
| `tailor.order.keepEditing` | Keep editing | Endelea kuhariri | false |  |
| `tailor.order.discard` | Leave | Ondoka | false |  |
| `tailor.order.statusHeading` | Status | Hali | false |  |
| `tailor.order.moveTo` | Move to {status} | Hamishia {status} | false |  |
| `tailor.order.changeStatus` | Change status | Badilisha hali | false |  |
| `tailor.order.history` | Status history | Historia ya hali | false |  |
| `tailor.order.editItems` | Edit measurements | Hariri vipimo | false |  |
| `tailor.order.inProgressTitle` | Order in progress | Oda inaendelea | false |  |
| `tailor.order.inProgressBody` | This order is already in progress — change anyway? Changes are recorded. | Oda hii tayari inaendelea — badilisha hata hivyo? Mabadiliko yanarekodiwa. | false |  |
| `tailor.order.changeAnyway` | Change anyway | Badilisha hata hivyo | false |  |
| `tailor.order.details` | Due date and notes | Tarehe na maelezo | false |  |
| `tailor.order.saveDetails` | Save changes | Hifadhi mabadiliko | false |  |
| `tailor.order.sheetShare` | Sheet & share | Karatasi na kushiriki | false |  |
| `tailor.order.delete` | Delete order | Futa oda | false |  |
| `tailor.order.deleteTitle` | Delete {no}? | Futa {no}? | false |  |
| `tailor.order.deleteBody` | Only new orders can be deleted. This cannot be undone. | Ni oda mpya tu zinazoweza kufutwa. Haiwezi kurudishwa. | false |  |
| `tailor.order.deleted` | Order {no} deleted | Oda {no} imefutwa | false |  |
| `tailor.share.title` | Specification sheet | Karatasi ya maelezo | false |  |
| `tailor.share.options` | Sheet options | Chaguo za karatasi | false |  |
| `tailor.share.includeName` | Include client name ({name}) | Weka jina la mteja ({name}) | false |  |
| `tailor.share.includeNameNote` | The name will appear on the sheet and in WhatsApp. This is recorded. | Jina litaonekana kwenye karatasi na WhatsApp. Hili linarekodiwa. | false |  |
| `tailor.share.format` | Format | Muundo | false |  |
| `tailor.share.png` | Picture (PNG) | Picha (PNG) | false |  |
| `tailor.share.pngHint` | For WhatsApp | Kwa WhatsApp | false |  |
| `tailor.share.pdf` | PDF | PDF | false |  |
| `tailor.share.pdfHint` | For printing | Kwa kuchapisha | false |  |
| `tailor.share.generate` | Generate sheet | Tengeneza karatasi | false |  |
| `tailor.share.preview` | Preview | Hakiki | false |  |
| `tailor.share.previewAlt` | Specification sheet for {no} | Karatasi ya maelezo ya {no} | false |  |
| `tailor.share.text` | Message text | Maandishi ya ujumbe | false |  |
| `tailor.share.whatsapp` | Share on WhatsApp | Shiriki kwa WhatsApp | false |  |
| `tailor.share.downloadPdf` | Download PDF | Pakua PDF | false |  |
| `tailor.share.print` | Print | Chapisha | false |  |
| `tailor.share.attachHint` | The picture was downloaded. Attach the downloaded picture in WhatsApp. | Picha imepakuliwa. Ambatisha picha iliyopakuliwa kwenye WhatsApp. | false |  |
| `tailor.conflicts.title` | Sync conflicts | Migongano ya vipimo | false |  |
| `tailor.conflicts.intro` | A client's phone sent measurements that differ from the version you already have. Choose which to keep. | Simu ya mteja ilituma vipimo vinavyotofautiana na toleo ulilonalo. Chagua cha kubaki. | false |  |
| `tailor.conflicts.badge` | {count, plural, one {# sync conflict} other {# sync conflicts}} | {count, plural, one {Mgongano #} other {Migongano #}} | false |  |
| `tailor.conflicts.server` | Here (v{version}) | Hapa (toleo {version}) | false |  |
| `tailor.conflicts.device` | From phone (v{version}) | Kutoka simu (toleo {version}) | false |  |
| `tailor.conflicts.different` | different | tofauti | false |  |
| `tailor.conflicts.useNewer` | Use the newer one | Tumia jipya | false |  |
| `tailor.conflicts.keepServer` | Keep this version | Baki na toleo hili | false |  |
| `tailor.conflicts.keptNewer` | Newer measurements kept for {code}. | Vipimo vipya vimebaki kwa {code}. | false |  |
| `tailor.conflicts.keptServer` | Existing measurements kept for {code}. | Vipimo vilivyokuwepo vimebaki kwa {code}. | false |  |
| `tailor.conflicts.empty` | No conflicts. | Hakuna migongano. | false |  |
| `tailor.audit.title` | My activity | Shughuli zangu | false |  |
| `tailor.audit.intro` | Everything you do with client data is recorded here. It cannot be changed. | Kila unachofanya na taarifa za wateja kinarekodiwa hapa. Hakiwezi kubadilishwa. | false |  |
| `audit.filters` | Filters | Vichujio | false |  |
| `audit.action` | Action | Kitendo | false |  |
| `audit.any` | Any | Yoyote | false |  |
| `audit.user` | User email | Barua pepe ya mtumiaji | false |  |
| `audit.role` | Role | Jukumu | false |  |
| `audit.roleTailor` | Tailor | Fundi | false |  |
| `audit.roleAdmin` | Administrator | Msimamizi | false |  |
| `audit.roleMeasurer` | Measurer | Mpimaji | false |  |
| `audit.entity` | Item type | Aina ya kitu | false |  |
| `audit.from` | From | Kuanzia | false |  |
| `audit.to` | To | Hadi | false |  |
| `audit.empty` | No activity matches. | Hakuna shughuli inayolingana. | false |  |
| `tailor.settings.title` | Settings | Mipangilio | false |  |
| `tailor.settings.preferences` | Preferences | Mapendeleo | false |  |
| `tailor.settings.units` | Units | Vipimo | false |  |
| `tailor.settings.unitsHint` | Measurements are always stored in millimetres. | Vipimo huhifadhiwa kwa milimita kila wakati. | false |  |
| `tailor.settings.cm` | Centimetres | Sentimita | false |  |
| `tailor.settings.in` | Inches | Inchi | false |  |
| `tailor.settings.includeName` | Include client name on sheets by default | Weka jina la mteja kwenye karatasi kwa kawaida | false |  |
| `tailor.settings.includeNameHint` | You can still change it for each sheet. | Bado unaweza kubadilisha kwa kila karatasi. | false |  |
| `tailor.settings.business` | Business | Biashara | false |  |
| `tailor.settings.presets` | Usual ease per garment | Nafasi ya kawaida kwa kila vazi | false |  |
| `tailor.settings.presetsHint` | Used by "Apply my usual ease" on new orders. | Inatumika na "Tumia nafasi yangu ya kawaida" kwenye oda mpya. | false |  |
| `tailor.settings.savePresets` | Save ease | Hifadhi nafasi | false |  |
| `tailor.settings.presetsSaved` | Usual ease saved. | Nafasi ya kawaida imehifadhiwa. | false |  |
| `tailor.settings.password` | Change password | Badilisha nenosiri | false |  |
| `tailor.settings.currentPassword` | Current password | Nenosiri la sasa | false |  |
| `tailor.settings.newPassword` | New password | Nenosiri jipya | false |  |
| `tailor.settings.changePassword` | Change password | Badilisha nenosiri | false |  |
| `tailor.settings.passwordChanged` | Password changed. | Nenosiri limebadilishwa. | false |  |
| `tailor.settings.wrongPassword` | The current password is not right. | Nenosiri la sasa si sahihi. | false |  |
| `tailor.settings.account` | Account | Akaunti | false |  |
| `tailor.settings.privacy` | Privacy notice | Taarifa ya faragha | false |  |
| `tailor.settings.saved` | Saved. | Imehifadhiwa. | false |  |
| `tailor.settings.version` | App version {app} · rules version {rules} | Toleo la programu {app} · toleo la kanuni {rules} | false |  |
| `admin.nav.accounts` | Accounts | Akaunti | false |  |
| `admin.nav.audit` | Audit | Kumbukumbu | false |  |
| `admin.nav.settings` | Settings | Mipangilio | false |  |
| `admin.nav.study` | Study | Utafiti | false |  |
| `admin.roleLabel` | Administrator | Msimamizi | false |  |
| `admin.accounts.title` | Accounts | Akaunti | false |  |
| `admin.accounts.tab.pending` | Pending | Zinasubiri | false |  |
| `admin.accounts.tab.active` | Active | Hai | false |  |
| `admin.accounts.tab.disabled` | Disabled | Zimezimwa | false |  |
| `admin.accounts.empty.pending` | No accounts waiting for approval. | Hakuna akaunti zinazosubiri kuidhinishwa. | false |  |
| `admin.accounts.empty.active` | No active accounts. | Hakuna akaunti hai. | false |  |
| `admin.accounts.empty.disabled` | No disabled or rejected accounts. | Hakuna akaunti zilizozimwa au kukataliwa. | false |  |
| `admin.accounts.status.pending` | Pending | Inasubiri | false |  |
| `admin.accounts.status.active` | Active | Hai | false |  |
| `admin.accounts.status.disabled` | Disabled | Imezimwa | false |  |
| `admin.accounts.status.rejected` | Rejected | Imekataliwa | false |  |
| `admin.accounts.select` | Select | Chagua | false |  |
| `admin.accounts.selectOne` | Select {email} | Chagua {email} | false |  |
| `admin.accounts.registered` | Registered | Ilisajiliwa | false |  |
| `admin.accounts.actions` | Actions | Vitendo | false |  |
| `admin.accounts.approve` | Approve | Idhinisha | false |  |
| `admin.accounts.reject` | Reject | Kataa | false |  |
| `admin.accounts.disable` | Disable | Zima | false |  |
| `admin.accounts.enable` | Re-enable | Washa tena | false |  |
| `admin.accounts.rejected` | rejected | imekataliwa | false |  |
| `admin.accounts.bulkApprove` | {count, plural, one {Approve # selected} other {Approve # selected}} | {count, plural, one {Idhinisha # iliyochaguliwa} other {Idhinisha # zilizochaguliwa}} | false |  |
| `admin.accounts.bulkDone` | {count, plural, one {# account approved.} other {# accounts approved.}} | {count, plural, one {Akaunti # imeidhinishwa.} other {Akaunti # zimeidhinishwa.}} | false |  |
| `admin.accounts.rejectTitle` | Reject {email}? | Kataa {email}? | false |  |
| `admin.accounts.reason` | Reason (shown in the audit log) | Sababu (inaonekana kwenye kumbukumbu) | false |  |
| `admin.accounts.disableTitle` | Disable {email}? | Zima {email}? | false |  |
| `admin.accounts.disableBody` | They will be signed out and cannot sign in until re-enabled. Their data is kept. | Ataondolewa na hawezi kuingia hadi akaunti iwashwe tena. Taarifa zake zinabaki. | false |  |
| `admin.accounts.done.approve` | {email} approved. | {email} ameidhinishwa. | false |  |
| `admin.accounts.done.reject` | {email} rejected. | {email} amekataliwa. | false |  |
| `admin.accounts.done.disable` | {email} disabled. | {email} amezimwa. | false |  |
| `admin.accounts.done.enable` | {email} re-enabled. | {email} amewashwa tena. | false |  |
| `admin.measurer.title` | Study measurers | Wapimaji wa utafiti | false |  |
| `admin.measurer.intro` | Measurer accounts can only enter tape readings. They never see the app's measurements. | Akaunti za wapimaji zinaweza kuweka usomaji wa tepu tu. Hawaoni vipimo vya programu kamwe. | false |  |
| `admin.measurer.create` | Create measurer account | Unda akaunti ya mpimaji | false |  |
| `admin.measurer.password` | Starting password | Nenosiri la kuanzia | false |  |
| `admin.measurer.code` | Measurer code | Herufi ya mpimaji | false |  |
| `admin.measurer.codeHint` | One letter, A to Z | Herufi moja, A hadi Z | false |  |
| `admin.measurer.codeInvalid` | Use one letter from A to Z. | Tumia herufi moja kutoka A hadi Z. | false |  |
| `admin.measurer.codeTaken` | Another measurer already has this code. | Mpimaji mwingine tayari ana herufi hii. | false |  |
| `admin.measurer.trained` | Trained on | Alifunzwa tarehe | false |  |
| `admin.measurer.trainedOn` | Trained {date} | Alifunzwa {date} | false |  |
| `admin.measurer.created` | Measurer {code} created. | Mpimaji {code} ameundwa. | false |  |
| `admin.measurer.empty` | No measurers yet. | Bado hakuna wapimaji. | false |  |
| `admin.measurer.label` | Measurer {code} | Mpimaji {code} | false |  |
| `admin.audit.title` | Audit log | Kumbukumbu za ukaguzi | false |  |
| `admin.audit.intro` | All users. Entries cannot be changed or deleted. | Watumiaji wote. Rekodi haziwezi kubadilishwa wala kufutwa. | false |  |
| `admin.audit.export` | Export CSV | Pakua CSV | false |  |
| `admin.audit.exported` | Audit CSV downloaded. The export is recorded. | CSV ya kumbukumbu imepakuliwa. Upakuaji umerekodiwa. | false |  |
| `admin.audit.when` | Time | Muda | false |  |
| `admin.audit.summary` | Details | Maelezo | false |  |
| `admin.audit.pages` | Pages | Kurasa | false |  |
| `admin.settings.title` | Settings | Mipangilio | false |  |
| `admin.settings.retention` | Data retention | Muda wa kuhifadhi taarifa | false |  |
| `admin.settings.retentionLabel` | Keep client measurements for | Hifadhi vipimo vya wateja kwa | false |  |
| `admin.settings.retentionHint` | Counted from the client's last order. Then the server deletes them. | Inahesabiwa kutoka oda ya mwisho ya mteja. Kisha seva inavifuta. | false |  |
| `admin.settings.months` | months | miezi | false |  |
| `admin.settings.saved` | Settings saved. The change is recorded. | Mipangilio imehifadhiwa. Mabadiliko yamerekodiwa. | false |  |
| `admin.settings.studyMode` | Study mode | Hali ya utafiti | false |  |
| `admin.settings.studyExplain` | Study mode shows the validation-study screens: participants, measurers, exports, study capture and tape entry for measurers. | Hali ya utafiti inaonyesha skrini za utafiti: washiriki, wapimaji, upakuaji, upigaji picha wa utafiti na uwekaji wa vipimo vya tepu. | false |  |
| `admin.settings.studyOn` | Study mode is on | Hali ya utafiti imewashwa | false |  |
| `admin.settings.studyOff` | Study mode is off | Hali ya utafiti imezimwa | false |  |
| `admin.settings.turnOn` | Turn study mode on | Washa hali ya utafiti | false |  |
| `admin.settings.turnOff` | Turn study mode off | Zima hali ya utafiti | false |  |
| `admin.settings.turnOnTitle` | Turn study mode on? | Washa hali ya utafiti? | false |  |
| `admin.settings.turnOffTitle` | Turn study mode off? | Zima hali ya utafiti? | false |  |
| `admin.settings.turnOnBody` | Study screens will appear for you and for measurers. Client and tailor screens do not change. | Skrini za utafiti zitaonekana kwako na kwa wapimaji. Skrini za wateja na mafundi hazibadiliki. | false |  |
| `admin.settings.turnOffBody` | Study screens will be hidden and measurers cannot enter readings. Study data is kept. | Skrini za utafiti zitafichwa na wapimaji hawawezi kuweka usomaji. Taarifa za utafiti zinabaki. | false |  |
| `admin.settings.consent` | Consent text | Maandishi ya idhini | false |  |
| `admin.settings.consentServed` | Consent version served: {version} | Toleo la idhini linalotumika: {version} | false |  |
| `admin.settings.consentHint` | The consent version comes with each app release and cannot be changed here. | Toleo la idhini linakuja na kila toleo la programu na haliwezi kubadilishwa hapa. | false |  |
| `admin.deletion.title` | Data deletion requests | Maombi ya kufuta taarifa | false |  |
| `admin.deletion.intro` | Requests sent from clients' phones (delete my data, withdraw consent). | Maombi yaliyotumwa kutoka simu za wateja (futa taarifa zangu, ondoa idhini). | false |  |
| `admin.deletion.received` | Received | Ilipokelewa | false |  |
| `admin.deletion.reason` | Request | Ombi | false |  |
| `admin.deletion.profiles` | Profiles | Vipimo | false |  |
| `admin.deletion.status` | Status | Hali | false |  |
| `admin.deletion.reason.delete` | Delete my data | Futa taarifa zangu | false |  |
| `admin.deletion.reason.withdraw_consent` | Withdraw consent | Ondoa idhini | false |  |
| `admin.deletion.status.received` | Received | Imepokelewa | false |  |
| `admin.deletion.status.completed` | Completed | Imekamilika | false |  |
| `admin.deletion.status.rejected` | Rejected | Imekataliwa | false |  |
| `admin.deletion.empty` | No deletion requests. | Hakuna maombi ya kufuta. | false |  |
| `admin.study.participants` | Participants | Washiriki | false |  |
| `admin.study.measurers` | Measurers | Wapimaji | false |  |
| `admin.study.exports` | Exports | Upakuaji | false |  |
| `admin.study.capture` | Study capture | Picha za utafiti | false |  |
| `admin.participants.title` | Study participants | Washiriki wa utafiti | false |  |
| `admin.participants.enrol` | Enrol a participant | Sajili mshiriki | false |  |
| `admin.participants.noPersonal` | Never enter a name, phone number or weight here. The paper key list stays on paper. | Usiweke jina, nambari ya simu wala uzito hapa. Orodha ya funguo inabaki kwenye karatasi. | false |  |
| `admin.participants.code` | Participant code | Nambari ya mshiriki | false |  |
| `admin.participants.codeHint` | P followed by three digits, for example P006 | P ikifuatiwa na tarakimu tatu, kwa mfano P006 | false |  |
| `admin.participants.codeInvalid` | Use P and three digits, for example P006. | Tumia P na tarakimu tatu, kwa mfano P006. | false |  |
| `admin.participants.codeTaken` | This participant code is already enrolled. | Nambari hii ya mshiriki tayari imesajiliwa. | false |  |
| `admin.participants.sex` | Sex | Jinsia | false |  |
| `admin.participants.female` | Female | Mwanamke | false |  |
| `admin.participants.male` | Male | Mwanaume | false |  |
| `admin.participants.age` | Age band | Kundi la umri | false |  |
| `admin.participants.venue` | Venue | Mahali | false |  |
| `admin.participants.enrolButton` | Enrol | Sajili | false |  |
| `admin.participants.enrolled` | {code} enrolled with client code {client}. | {code} amesajiliwa kwa nambari ya mteja {client}. | false |  |
| `admin.participants.list` | Enrolled | Waliosajiliwa | false |  |
| `admin.participants.empty` | No participants yet. | Bado hakuna washiriki. | false |  |
| `admin.participants.enrolledOn` | enrolled {date} | alisajiliwa {date} | false |  |
| `admin.participants.sets` | Capture sets: {n} of 3 | Seti za picha: {n} kati ya 3 | false |  |
| `admin.participants.readings` | Tape readings: {done} of 9 sites complete | Usomaji wa tepu: sehemu {done} kati ya 9 zimekamilika | false |  |
| `admin.participants.startCapture` | Start set {set} | Anza seti {set} | false |  |
| `admin.export.intro` | The server builds the files. Downloads are recorded in the audit log. | Seva inatengeneza faili. Upakuaji unarekodiwa kwenye kumbukumbu. | false |  |
| `admin.export.captures` | Capture records | Rekodi za picha | false |  |
| `admin.export.capturesHint` | One row per capture set with the Appendix E fields: checks, scales, the eight measurements with flags, timing, conditions and device. | Safu moja kwa kila seti yenye sehemu za Kiambatisho E: ukaguzi, ukubwa, vipimo vinane na alama, muda, mazingira na kifaa. | false |  |
| `admin.export.capturesButton` | Download capture records (CSV) | Pakua rekodi za picha (CSV) | false |  |
| `admin.export.reference` | Reference readings | Usomaji wa marejeo | false |  |
| `admin.export.referenceHint` | One row per tape reading: participant, site, measurer, reading number, value in cm. | Safu moja kwa kila usomaji wa tepu: mshiriki, sehemu, mpimaji, nambari ya usomaji, thamani kwa sm. | false |  |
| `admin.export.referenceButton` | Download reference readings (CSV) | Pakua usomaji wa marejeo (CSV) | false |  |
| `admin.export.preparing` | Preparing the file… | Inatayarisha faili… | false |  |
| `admin.export.done` | {rows, plural, one {Downloaded # row.} other {Downloaded # rows.}} | {rows, plural, one {Safu # imepakuliwa.} other {Safu # zimepakuliwa.}} | false |  |
| `study.off` | Study mode is off. | Hali ya utafiti imezimwa. | false |  |
| `study.ref.locked` | This reading is already saved and locked. Ask the administrator to correct it. | Usomaji huu tayari umehifadhiwa na kufungwa. Muombe msimamizi aurekebishe. | false |  |
| `study.ref.title` | Tape readings | Usomaji wa tepu | false |  |
| `study.ref.header` | Measurer {code} | Mpimaji {code} | false |  |
| `study.ref.intro` | Enter your own tape readings. You will not see the app's values or another measurer's readings. | Weka usomaji wako wa tepu. Hutaona vipimo vya programu wala usomaji wa mpimaji mwingine. | false |  |
| `study.ref.offline` | You are offline. Readings are kept on this device and sent when you reconnect. | Huna mtandao. Usomaji unahifadhiwa kwenye kifaa hiki na kutumwa ukiunganisha tena. | false |  |
| `study.ref.participant` | Participant code | Nambari ya mshiriki | false |  |
| `study.ref.participantHint` | For example P001 | Kwa mfano P001 | false |  |
| `study.ref.participantInvalid` | Use P and three digits, for example P001. | Tumia P na tarakimu tatu, kwa mfano P001. | false |  |
| `study.ref.participantUnknown` | {code} is not enrolled. Check the code. | {code} hajasajiliwa. Kagua nambari. | false |  |
| `study.ref.readingNo` | Reading | Usomaji | false |  |
| `study.ref.reading` | Reading {n} | Usomaji {n} | false |  |
| `study.ref.sites` | Measurements in centimetres (0.1 cm) | Vipimo kwa sentimita (sm 0.1) | false |  |
| `study.ref.howTo` | How to measure {site} | Jinsi ya kupima {site} | false |  |
| `study.ref.precision` | Use at most one decimal, for example 86.5 | Tumia desimali moja tu, kwa mfano 86.5 | false |  |
| `study.ref.noneEntered` | Enter at least one measurement. | Weka angalau kipimo kimoja. | false |  |
| `study.ref.submit` | Save and lock reading | Hifadhi na funga usomaji | false |  |
| `study.ref.lockedNote` | Saved readings are locked. Only the administrator can correct them. | Usomaji uliohifadhiwa unafungwa. Ni msimamizi tu anayeweza kuurekebisha. | false |  |
| `study.ref.confirmTitle` | Please check before saving | Tafadhali kagua kabla ya kuhifadhi | false |  |
| `study.ref.implausible` | You entered {value} for {site}. Is that correct? | Uliweka {value} kwa {site}. Je, ni sahihi? | false |  |
| `study.ref.empty` | {count, plural, one {# measurement is empty.} other {# measurements are empty.}} | {count, plural, one {Kipimo # kiko wazi.} other {Vipimo # viko wazi.}} | false |  |
| `study.ref.goBack` | Go back | Rudi | false |  |
| `study.ref.confirmSubmit` | Yes, save | Ndiyo, hifadhi | false |  |
| `study.ref.saved` | Saved {participant}, reading {reading}, measurer {measurer} | Imehifadhiwa {participant}, usomaji {reading}, mpimaji {measurer} | false |  |
| `study.ref.queued` | Saved on this device. It will send by itself when you are online. | Imehifadhiwa kwenye kifaa hiki. Itatumwa yenyewe ukiwa mtandaoni. | false |  |
| `study.ref.outOfOrder` | Reading 2 was entered before reading 1. This is recorded. | Usomaji 2 uliwekwa kabla ya usomaji 1. Hili linarekodiwa. | false |  |
| `study.ref.next` | Enter next reading | Weka usomaji unaofuata | false |  |
| `study.ref.pending` | {count, plural, one {# reading waiting to send.} other {# readings waiting to send.}} | {count, plural, one {Usomaji # unasubiri kutumwa.} other {Usomaji # unasubiri kutumwa.}} | false |  |
| `study.ref.sendNow` | Send now | Tuma sasa | false |  |
| `study.ref.flushed` | Sent {sent} queued readings; {locked} were already locked. | Usomaji {sent} uliosubiri umetumwa; {locked} ulikuwa tayari umefungwa. | false |  |
| `study.instr.stature` | Barefoot, heels together against the wall, head level. Lower the headboard to the top of the head; read at eye level. | Bila viatu, visigino pamoja ukutani, kichwa sawa. Shusha kibao hadi juu ya kichwa; soma ukiwa usawa wa macho. | false |  |
| `study.instr.shoulder` | Across the back from the tip of one shoulder bone (acromion) to the other, following the curve. | Mgongoni kutoka ncha ya mfupa wa bega mmoja (akromioni) hadi mwingine, ukifuata mkunjo. | false |  |
| `study.instr.chest` | Tape level around the fullest part of the chest (bust), under the arms, at normal breathing out. | Tepu sawa kuzunguka sehemu kubwa zaidi ya kifua, chini ya mikono, baada ya kupumua kawaida. | false |  |
| `study.instr.waist` | Tape level around the natural waist (narrowest part between ribs and hip bone), not pulled tight. | Tepu sawa kuzunguka kiuno cha asili (sehemu nyembamba kati ya mbavu na mfupa wa nyonga), isibane. | false |  |
| `study.instr.hip` | Tape level around the widest part of the buttocks, feet together. | Tepu sawa kuzunguka sehemu pana zaidi ya makalio, miguu pamoja. | false |  |
| `study.instr.sleeve` | From the shoulder tip over the slightly bent elbow to the wrist bone. | Kutoka ncha ya bega kupitia kiwiko kilichopinda kidogo hadi mfupa wa kifundo. | false |  |
| `study.instr.outleg` | At the side, from the natural waist straight down to the floor, barefoot. | Pembeni, kutoka kiuno cha asili moja kwa moja hadi sakafuni, bila viatu. | false |  |
| `study.instr.inleg` | From the crotch straight down the inside of the leg to the floor, barefoot. | Kutoka kwenye msamba moja kwa moja ndani ya mguu hadi sakafuni, bila viatu. | false |  |
| `study.instr.neck` | Around the neck just below the Adam's apple, one finger under the tape. | Kuzunguka shingo chini kidogo ya kongomeo, kidole kimoja chini ya tepu. | false |  |
| `study.vault.title` | Study image vault | Hifadhi ya picha za utafiti | false |  |
| `study.vault.disabled` | Disabled pending ethics approval. | Imezimwa hadi idhini ya maadili ipatikane. | false |  |
| `study.vault.disabledHint` | Saving study photos needs written approval from the owner and the MKU ethics committee. Until then no photo can be kept. | Kuhifadhi picha za utafiti kunahitaji idhini ya maandishi ya mmiliki na kamati ya maadili ya MKU. Hadi hapo hakuna picha inayoweza kuhifadhiwa. | false |  |
| `study.vault.explain` | Photos are encrypted on this phone and downloaded as one file for transfer by cable. Nothing is uploaded. | Picha zinasimbwa kwenye simu hii na kupakuliwa kama faili moja kwa kuhamishwa kwa kebo. Hakuna kinachopakiwa mtandaoni. | false |  |
| `study.vault.consent` | Paper consent includes keeping photos | Idhini ya karatasi inajumuisha kuhifadhi picha | false |  |
| `study.vault.passphrase` | Passphrase for this session | Kaulisiri ya kipindi hiki | false |  |
| `study.vault.passphraseHint` | At least 12 characters. It is never stored. | Angalau herufi 12. Haihifadhiwi kamwe. | false |  |
| `study.vault.passphraseShort` | Use at least 12 characters. | Tumia angalau herufi 12. | false |  |
| `study.vault.save` | Save encrypted photos | Hifadhi picha zilizosimbwa | false |  |
| `study.cap.title` | Study capture | Upigaji picha wa utafiti | false |  |
| `study.cap.intro` | Researcher-run capture for the validation study. The participant does not see this screen. | Upigaji picha unaoendeshwa na mtafiti kwa utafiti wa uthibitishaji. Mshiriki haoni skrini hii. | false |  |
| `study.cap.participant` | Participant code | Nambari ya mshiriki | false |  |
| `study.cap.participantUnknown` | {code} is not enrolled. Enrol the participant first. | {code} hajasajiliwa. Msajili mshiriki kwanza. | false |  |
| `study.cap.set` | Set number | Nambari ya seti | false |  |
| `study.cap.mode` | Capture mode | Hali ya upigaji | false |  |
| `study.cap.modeSelf` | Self (participant alone) | Peke yake (mshiriki pekee) | false |  |
| `study.cap.modeAssisted` | Assisted (researcher presses) | Kwa msaada (mtafiti anabonyeza) | false |  |
| `study.cap.modeHint` | Sets 1 and 3 are self-capture and set 2 is assisted by default (Section 3.6.2). | Seti 1 na 3 ni za kujipiga na seti 2 ni ya msaada kwa kawaida (Sehemu 3.6.2). | false |  |
| `study.cap.lighting` | Lighting | Mwanga | false |  |
| `study.cap.light.window` | Window | Dirisha | false |  |
| `study.cap.light.lamp` | Lamp | Taa | false |  |
| `study.cap.light.outdoor` | Outdoor | Nje | false |  |
| `study.cap.distance` | Distance wall to phone | Umbali kutoka ukuta hadi simu | false |  |
| `study.cap.distanceHint` | Metres, one decimal, 1.5 to 3.5 | Mita, desimali moja, 1.5 hadi 3.5 | false |  |
| `study.cap.distanceErr` | Enter a distance from 1.5 to 3.5 m with at most one decimal. | Weka umbali kuanzia mita 1.5 hadi 3.5 wenye desimali moja tu. | false |  |
| `study.cap.fit` | Clothing fit (researcher judgement) | Ubana wa nguo (maoni ya mtafiti) | false |  |
| `study.cap.stature` | Stature from the tape | Urefu kutoka kwa utepe | false |  |
| `study.cap.phone` | Phone model | Aina ya simu | false |  |
| `study.cap.phoneHint` | Filled in from the browser where possible; on iPhone pick the model. | Imejazwa kutoka kivinjari inapowezekana; kwa iPhone chagua aina. | false |  |
| `study.cap.lux` | Lux reading | Kipimo cha lux | false |  |
| `study.cap.luxHint` | From a phone light-meter app, if you have one. | Kutoka programu ya kupima mwanga, kama unayo. | false |  |
| `study.cap.paper` | Paper consent confirmed for {code} | Idhini ya karatasi imethibitishwa kwa {code} | false |  |
| `study.cap.start` | Start capture | Anza upigaji | false |  |
| `study.cap.nextSet` | Start set {set} for {code} | Anza seti {set} kwa {code} | false |  |
| `study.cap.allSets` | All three sets are captured for {code}. | Seti zote tatu zimepigwa kwa {code}. | false |  |
| `study.cap.savedStudy` | Study set {set} for {code} saved. | Seti ya utafiti {set} kwa {code} imehifadhiwa. | false |  |
