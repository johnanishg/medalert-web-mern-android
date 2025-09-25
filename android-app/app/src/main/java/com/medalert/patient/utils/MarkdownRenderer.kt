package com.medalert.patient.utils

import android.content.Context
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MarkdownRenderer @Inject constructor() {
    
    fun initialize(context: Context) {
        // No initialization needed for simple text processing
    }
    
    fun renderMarkdown(markdown: String): String {
        // Simple markdown-to-text conversion for now
        return markdown
            .replace(Regex("\\*\\*([^*]+)\\*\\*"), "$1") // bold -> plain
            .replace(Regex("\\*([^*]+)\\*"), "$1") // italics -> plain
            .replace(Regex("`([^`]+)`"), "$1") // inline code -> plain
            .replace(Regex("```[\\s\\S]*?```"), "") // code blocks -> remove
            .replace(Regex("^\\s{0,3}(#+)\\s+", RegexOption.MULTILINE), "") // headings -> remove
            .replace(Regex("\\[([^\\]]+)\\]\\([^)]+\\)"), "$1") // links -> text only
            .replace(Regex(">\\s?"), "") // blockquotes -> remove
            .replace(Regex("[-*+]\\s+"), "• ") // list bullets -> bullet
            .replace(Regex("\\s{2,}"), " ") // extra spaces
            .trim()
    }
    
    fun stripMarkdown(markdown: String): String {
        return markdown
            .replace(Regex("```[\\s\\S]*?```"), "") // code blocks
            .replace(Regex("`([^`]+)`"), "$1") // inline code
            .replace(Regex("^\\s{0,3}(#+)\\s+", RegexOption.MULTILINE), "") // headings
            .replace(Regex("\\*\\*([^*]+)\\*\\*"), "$1") // bold
            .replace(Regex("\\*([^*]+)\\*"), "$1") // italics
            .replace(Regex("\\[([^\\]]+)\\]\\([^)]+\\)"), "$1") // links
            .replace(Regex(">\\s?"), "") // blockquotes
            .replace(Regex("[-*+]\\s+"), "") // list bullets
            .replace(Regex("\\s{2,}"), " ") // extra spaces
            .trim()
    }
}
