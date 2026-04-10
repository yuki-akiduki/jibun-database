import Badge from '@/components/ui/Badge';
import { categoryStyles, defaultCategoryStyle } from '@/lib/constants/categories';

type Props = {
  name: string;
};

export default function CategoryBadge({ name }: Props) {
  const style = categoryStyles[name] ?? defaultCategoryStyle;
  return <Badge className={style.badge}>{name}</Badge>;
}
