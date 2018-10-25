import django

from django.db import models
from django.contrib.auth.models import User
from django.utils.encoding import smart_str


class DebugCategory(models.Model):
    """
    Class Debug Category
    """
    name = models.CharField(max_length=100)

    class Meta:
        verbose_name = 'Exception Category'
        verbose_name_plural = 'Exception Categories'

    def __unicode__(self):
        return "%s" % (smart_str(self.name))


class DebugRow(models.Model):
    """
    Class Row of Debug Exceptions
    """
    PRIORITY_CHOICES = (
        (1, 'Very Low'),
        (2, 'Low'),
        (3, 'Medium'),
        (4, 'High'),
        (5, 'Very High'),
    )
    request_path = models.TextField(
        blank=True,
        null=True
    )
    ex = models.TextField()
    extra_ex = models.TextField(
        blank=True,
        null=True
    )
    user = models.ForeignKey(
        User,
        blank=True,
        null=True
    )
    priority = models.IntegerField(
        default=3,
        choices=PRIORITY_CHOICES
    )
    date = models.DateTimeField(
        default=django.utils.timezone.now
    )
    read = models.BooleanField(
        default=False
    )
    notes = models.TextField(
        blank=True,
        null=True
    )
    fixed = models.BooleanField(
        default=False
    )
    category = models.ForeignKey(
        DebugCategory,
        default=1
    )

    class Meta:
        verbose_name = 'Exception'
        verbose_name_plural = 'Exceptions'

    def __unicode__(self):
        return "%s" % (self.id)