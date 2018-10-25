from django.contrib.auth.models import User
from rest_framework import serializers

from core.models import Profile, Service, TimeSlot, Location, Order, \
    Address, Event, OrderNote, Chat, ChatMessage, Issue, OrderFeedback, Notification, \
    OrderTrackingInfo, Configuration


class ConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Configuration
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name')


class UserProtectedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'first_name', 'last_name')


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'street', 'city', 'zipCode', 'region', 'country']


class OrderFeedbackSerializer(serializers.ModelSerializer):
    username = serializers.CharField()

    class Meta:
        model = OrderFeedback
        fields = ['dateCreated', 'score', 'text', 'username']


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    defaultAddress = AddressSerializer(read_only=True)
    addresses = AddressSerializer(read_only=True, many=True)
    forwarderData = serializers.ReadOnlyField()
    buyerFeedback = OrderFeedbackSerializer(read_only=True, many=True)
    forwarderFeedback = OrderFeedbackSerializer(read_only=True, many=True)
    feedback = serializers.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        model = Profile
        exclude = ['keyExpires', 'activationKey', 'verificationCode']


class ProfileProtectedSerializer(serializers.ModelSerializer):
    user = UserProtectedSerializer(read_only=True)
    forwarderData = serializers.ReadOnlyField()
    buyerFeedback = OrderFeedbackSerializer(read_only=True, many=True)
    forwarderFeedback = OrderFeedbackSerializer(read_only=True, many=True)
    feedback = serializers.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        model = Profile
        exclude = [
            'termsAgreement',
            'keyExpires',
            'activationKey',
            'verificationCode',
            'defaultAddress',
            'addresses',
            'dob',
            'mobile',
            'ssn',
            'oneSignalPlayerId',
            'oneSignalPushToken',
            'enable2FASMS',
            'enable2FAGoogle',
            'IDDocFrontImage',
            'IDDocBackImage',
            'docVerified',
            'ProofOfresidenceImage',
            'ProofOfresidenceVerified',
            'SelfIDocImage',
            'SelfIDocVerified',
            'mobileVerified',
            'accountTier',
            'currencySetting',
            'measuresSetting',
            'languageSetting'
        ]


class ProfileWithAddressesSerializer(serializers.ModelSerializer):
    user = UserProtectedSerializer(read_only=True)
    defaultAddress = AddressSerializer(read_only=True)
    addresses = AddressSerializer(read_only=True, many=True)
    forwarderData = serializers.ReadOnlyField()
    buyerFeedback = OrderFeedbackSerializer(read_only=True, many=True)
    forwarderFeedback = OrderFeedbackSerializer(read_only=True, many=True)
    feedback = serializers.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        model = Profile
        exclude = [
            'termsAgreement',
            'keyExpires',
            'activationKey',
            'verificationCode',
            'dob',
            'mobile',
            'ssn',
            'oneSignalPlayerId',
            'oneSignalPushToken',
            'enable2FASMS',
            'enable2FAGoogle',
            'IDDocFrontImage',
            'IDDocBackImage',
            'docVerified',
            'ProofOfresidenceImage',
            'ProofOfresidenceVerified',
            'SelfIDocImage',
            'SelfIDocVerified',
            'mobileVerified',
            'accountTier',
            'currencySetting',
            'measuresSetting',
            'languageSetting'
        ]


class TimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlot
        fields = ['start', 'end']


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['name', 'countryCode', 'lat', 'lng']


class ServiceSerializer(serializers.ModelSerializer):
    timeSlots = TimeSlotSerializer(read_only=True, many=True)
    profile = ProfileSerializer(read_only=True)
    locationFrom = LocationSerializer(read_only=True)
    locationTos = LocationSerializer(read_only=True, many=True)
    lowestPrice = serializers.ReadOnlyField()
    highestPrice = serializers.ReadOnlyField()

    class Meta:
        model = Service
        exclude = ['created', 'updated']

    def create(self, validated_data):
        service = Service.objects.create(**validated_data)
        service.profile = validated_data['profile']
        service.save()
        return service


class ServiceProtectedSerializer(serializers.ModelSerializer):
    timeSlots = TimeSlotSerializer(read_only=True, many=True)
    profile = ProfileProtectedSerializer(read_only=True)
    locationFrom = LocationSerializer(read_only=True)
    locationTos = LocationSerializer(read_only=True, many=True)
    lowestPrice = serializers.ReadOnlyField()
    highestPrice = serializers.ReadOnlyField()

    class Meta:
        model = Service
        exclude = ['created', 'updated', 'profileForwarderAddress']


class ServiceWithAddressesSerializer(serializers.ModelSerializer):
    timeSlots = TimeSlotSerializer(read_only=True, many=True)
    profile = ProfileWithAddressesSerializer(read_only=True)
    locationFrom = LocationSerializer(read_only=True)
    locationTos = LocationSerializer(read_only=True, many=True)
    lowestPrice = serializers.ReadOnlyField()
    highestPrice = serializers.ReadOnlyField()

    class Meta:
        model = Service
        exclude = ['created', 'updated']


class OrderNotesSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = OrderNote
        fields = '__all__'


class OrderNotesProtectedSerializer(serializers.ModelSerializer):
    profile = ProfileProtectedSerializer(read_only=True)

    class Meta:
        model = OrderNote
        fields = '__all__'


class OrderTrackingInfoSerializer(serializers.ModelSerializer):
    profile = ProfileProtectedSerializer(read_only=True)
    courierName = serializers.ReadOnlyField()

    class Meta:
        model = OrderTrackingInfo
        fields = '__all__'


class OrderSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)
    profile = ProfileSerializer(read_only=True)
    notes = OrderNotesSerializer(read_only=True, many=True)
    trackings = OrderTrackingInfoSerializer(read_only=True, many=True)
    issue = serializers.ReadOnlyField()
    feedback = serializers.ReadOnlyField()
    forwarderGoodValue = serializers.ReadOnlyField()
    buyerGoodValue = serializers.ReadOnlyField()

    class Meta:
        model = Order
        exclude = ['code']

    def create(self, validated_data):
        order = Order.objects.create(**validated_data)
        order.profile = validated_data['profile']
        order.service = validated_data['service']
        order.save()
        return order

    def update(self, instance, validated_data):
        # TODO: not a good solution!!!
        if type(validated_data.get('service')) == 'int':
            instance.service = Order.objects.get(id=validated_data.get('service', instance.service))
        instance.save()
        return instance


class OrderProtectedSerializer(serializers.ModelSerializer):
    service = ServiceProtectedSerializer(read_only=True)
    profile = ProfileProtectedSerializer(read_only=True)
    notes = OrderNotesProtectedSerializer(read_only=True, many=True)
    trackings = OrderTrackingInfoSerializer(read_only=True, many=True)
    issue = serializers.ReadOnlyField()
    feedback = serializers.ReadOnlyField()
    forwarderGoodValue = serializers.ReadOnlyField()
    buyerGoodValue = serializers.ReadOnlyField()

    class Meta:
        model = Order
        exclude = ['code', 'deliveryAddress', 'profileForwarderAddress']

    def create(self, validated_data):
        order = Order.objects.create(**validated_data)
        order.profile = validated_data['profile']
        order.service = validated_data['service']
        order.save()
        return order

    def update(self, instance, validated_data):
        # TODO: not a good solution!!!
        if type(validated_data.get('service')) == 'int':
            instance.service = Order.objects.get(id=validated_data.get('service', instance.service))
        instance.save()
        return instance


class OrderWithAddressesSerializer(serializers.ModelSerializer):
    service = ServiceWithAddressesSerializer(read_only=True)
    profile = ProfileWithAddressesSerializer(read_only=True)
    notes = OrderNotesProtectedSerializer(read_only=True, many=True)
    trackings = OrderTrackingInfoSerializer(read_only=True, many=True)
    issue = serializers.ReadOnlyField()
    feedback = serializers.ReadOnlyField()
    forwarderGoodValue = serializers.ReadOnlyField()
    buyerGoodValue = serializers.ReadOnlyField()

    class Meta:
        model = Order
        exclude = ['code']

    def create(self, validated_data):
        order = Order.objects.create(**validated_data)
        order.profile = validated_data['profile']
        order.service = validated_data['service']
        order.save()
        return order

    def update(self, instance, validated_data):
        # TODO: not a good solution!!!
        if type(validated_data.get('service')) == 'int':
            instance.service = Order.objects.get(id=validated_data.get('service', instance.service))
        instance.save()
        return instance


class EventSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True, many=True)
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = Event
        exclude = []


class ChatMessageSerializer(serializers.ModelSerializer):
    sender = UserProtectedSerializer(read_only=True)
    senderAvatar = serializers.ImageField()
    adminMessage = serializers.BooleanField()

    class Meta:
        model = ChatMessage
        fields = '__all__'


class ChatSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(read_only=True, many=True)

    class Meta:
        model = Chat
        fields = '__all__'


class IssueSerializer(serializers.ModelSerializer):
    order = OrderSerializer(read_only=True)
    profile = ProfileSerializer(read_only=True)
    chat = ChatSerializer(read_only=True)

    class Meta:
        model = Issue
        fields = '__all__'

    def create(self, validated_data):
        issue = Issue.objects.create(**validated_data)
        issue.profile = validated_data['profile']
        issue.order = validated_data['order']
        issue.save()
        return issue


class IssueProtectedSerializer(serializers.ModelSerializer):
    order = OrderProtectedSerializer(read_only=True)
    profile = ProfileProtectedSerializer(read_only=True)
    chat = ChatSerializer(read_only=True)

    class Meta:
        model = Issue
        fields = '__all__'

    def create(self, validated_data):
        issue = Issue.objects.create(**validated_data)
        issue.profile = validated_data['profile']
        issue.order = validated_data['order']
        issue.save()
        return issue


class IssueWithAddressesSerializer(serializers.ModelSerializer):
    order = OrderWithAddressesSerializer(read_only=True)
    profile = ProfileWithAddressesSerializer(read_only=True)
    chat = ChatSerializer(read_only=True)

    class Meta:
        model = Issue
        fields = '__all__'

    def create(self, validated_data):
        issue = Issue.objects.create(**validated_data)
        issue.profile = validated_data['profile']
        issue.order = validated_data['order']
        issue.save()
        return issue


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        exclude = ['user']