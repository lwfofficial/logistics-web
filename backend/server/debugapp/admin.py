from django.contrib import admin

from models import *


class DebugCategoryAdmin(admin.ModelAdmin):
    model = DebugCategory
    ordering = ['-id',]
    list_display = (
        'id',
        'name',
    )
    list_filter = ('name',)


class DebugRowAdmin(admin.ModelAdmin):
    model = DebugRow
    ordering = ['-id',]
    list_display = (
        'id',
        'category',
        'priority',
        'date',
        'read',
        'fixed',
        'user'
    )
    list_filter = (
        'category',
        'priority',
        'date',
        'read'
    )


admin.site.register(DebugRow, DebugRowAdmin)
admin.site.register(DebugCategory, DebugCategoryAdmin)