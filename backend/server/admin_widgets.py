from django.utils.safestring import mark_safe
from django.utils.translation import ugettext_lazy as _
from django.contrib.admin.widgets import AdminFileWidget


class AdminImageFileWidget(AdminFileWidget):
    def render(self, name, value, attrs=None):
        output = []
        if value and getattr(value, "url", None):
            image_url = value.url
            file_name=str(value)
            output.append(u'<div class="adminimagefilewidget"> <a href="%s" target="_blank"><img src="%s" alt="%s" style="object-fit: cover; max-width: 200px;"/></a> %s </div>' % \
                          (image_url, image_url, file_name, _('')))
        output.append(super(AdminFileWidget, self).render(name, value, attrs))
        return mark_safe(u''.join(output))