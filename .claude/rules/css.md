---
paths:
  - "src/**/*.tsx"
  - "src/**/*.ts"
  - "src/**/*.css"
---

# CSSルール

- **CSS実装は禁止**: Tailwind CSS v4 を使用するが、ユーザーが「CSSやっていい」と明示的に許可するまで、スタイリング関連のコード（className, Tailwindクラス含む）は一切書かない。構造とロジックだけを実装すること
- **インラインCSS禁止**: `style={{ }}` 属性は使用しない
