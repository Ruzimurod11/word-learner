import "dotenv/config";
import { sql } from "drizzle-orm";
import { db, pool } from "./index.ts";

// Bir xil `english` boshqa bo'limda to'ldirilgan bo'lsa, transkripsiya /
// turkum / audio'ni bo'sh qatorlarga ko'chiradi — yangi kitob qo'shilganda
// takroriy so'zlar uchun lug'at API va TTS kvotasi behuda sarflanmasin.
// Standart rejim — dry-run; yozish uchun `--apply` bayrog'i kerak.

// Har bir `english` uchun bitta to'ldirilgan manba qiymat tanlaydi.
const source = sql`
  select lower(english) as e,
         (array_agg(transcription order by id) filter (where transcription is not null))[1] as transcription,
         (array_agg(part_of_speech order by id) filter (where part_of_speech is not null))[1] as part_of_speech,
         (array_agg(audio_url order by id) filter (where audio_url is not null))[1] as audio_url
  from words
  group by 1
`;

const fillable = sql`
  w.transcription is null and src.transcription is not null
  or w.part_of_speech is null and src.part_of_speech is not null
  or w.audio_url is null and src.audio_url is not null
`;

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");

  const stats = await db.execute(sql`
    with src as (${source})
    select count(*) filter (where w.transcription is null and src.transcription is not null)::int as transcription,
           count(*) filter (where w.part_of_speech is null and src.part_of_speech is not null)::int as part_of_speech,
           count(*) filter (where w.audio_url is null and src.audio_url is not null)::int as audio_url
    from words w join src on src.e = lower(w.english)
  `);
  console.table(stats.rows);

  if (!apply) {
    console.log("Dry run. Re-run with --apply to write.");
  } else {
    const updated = await db.execute(sql`
      update words as w set
        transcription = coalesce(w.transcription, src.transcription),
        part_of_speech = coalesce(w.part_of_speech, src.part_of_speech),
        audio_url = coalesce(w.audio_url, src.audio_url),
        updated_at = now()
      from (${source}) src
      where src.e = lower(w.english) and (${fillable})
    `);
    console.log(`Applied: ${updated.rowCount} rows.`);
  }

  await pool.end();
}

main().catch((err: unknown) => {
  console.error("Copy word meta failed:", err);
  process.exit(1);
});
