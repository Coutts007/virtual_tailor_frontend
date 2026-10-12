# Kiswahili review (decision 10)

First-draft Kiswahili written by the agent. A native speaker sets `reviewed` to `true` and adds their initials. Editing a Kiswahili string resets it to `false` when this file is regenerated (`npm run i18n:review`).

Guidance: short, concrete sentences; read at about an 11-year-old level; avoid literal translation of idioms.

**Progress:** 0 of 160 reviewed.

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
| `welcome.phase0Note` | Virtual Tailor is being built. The measuring flow arrives in a later phase. | Virtual Tailor inajengwa. Hatua za kupima zitakuja baadaye. | false |  |
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
