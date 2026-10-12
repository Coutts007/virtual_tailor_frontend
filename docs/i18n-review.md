# Kiswahili review (decision 10)

First-draft Kiswahili written by the agent. A native speaker sets `reviewed` to `true` and adds their initials. Editing a Kiswahili string resets it to `false` when this file is regenerated (`npm run i18n:review`).

Guidance: short, concrete sentences; read at about an 11-year-old level; avoid literal translation of idioms.

**Progress:** 0 of 433 reviewed.

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
