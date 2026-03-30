import Badge from '@/components/ui/Badge';
import { categoryColors } from '@/lib/constants/categories';

type Props = {
  name: string;
};

export default function CategoryBadge({ name }: Props) {
  const color = categoryColors[name];
  return <Badge color={color}>{name}</Badge>;
}
