import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import { fixupConfigRules } from '@eslint/compat'

// Khởi tạo FlatCompat để tái sử dụng các cấu hình cũ (eslint-config-next)
const compat = new FlatCompat({
    baseDirectory: import.meta.dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
})

export default fixupConfigRules([
    // Kế thừa rule Next.js + Core Web Vitals + TS
    ...compat.extends('next/core-web-vitals', 'next/typescript'),
    // Bỏ qua thư mục build
    {
        // Danh sách file/thư mục bỏ qua (di chuyển từ .eslintignore)
        ignores: [
            '.next',
            'node_modules',
            '.now/*',
            '*.css',
            '.changeset',
            'dist',
            'esm/*',
            'public/*',
            'tests/*',
            'scripts/*',
            '*.config.js',
            '.DS_Store',
            'coverage',
            'build',
        ],
    },
])