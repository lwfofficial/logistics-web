from rest_framework import serializers

from core.serializers import ProfileSerializer
from mobile.models import InstantDeliveryOrder, InstantDeliveryCourier


class InstantDeliveryOrderSerializer(serializers.ModelSerializer):
    buyer = ProfileSerializer(read_only=True)
    courier = ProfileSerializer(read_only=True)
    feedback = serializers.ReadOnlyField()
    priceRange = serializers.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        model = InstantDeliveryOrder
        fields = '__all__'

    def create(self, validated_data):
        order = InstantDeliveryOrder.objects.create(**validated_data)
        order.buyer = validated_data['buyer']
        order.save()
        return order


class InstantDeliveryCourierSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = InstantDeliveryCourier
        fields = '__all__'

    def create(self, validated_data):
        courier = InstantDeliveryCourier.objects.create(**validated_data)
        courier.profile = validated_data['profile']
        courier.save()
        return courier
