import { LogoutButton } from '@/components/button/LogoutButton';
import { DataBaseInput } from '@/components/form/DataBaseInput';
import { MetaPreview } from '@/components/MetaPreview';
import { createClient } from '@/lib/supabase/server';
export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.from('entries').select('*');
  console.log(data);
  return (
    <div>
      <DataBaseInput />
      <MetaPreview />

      <LogoutButton />
      <div>一覧</div>
    </div>
  );
}
